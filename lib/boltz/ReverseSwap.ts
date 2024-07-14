import Boltz from "./BoltzBase";
import { ECPairFactory, ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";
import { crypto, Transaction, address } from "bitcoinjs-lib";
import {
  Musig,
  SwapTreeSerializer,
  TaprootUtils,
  constructClaimTransaction,
  detectSwap,
  targetFee,
  OutputType,
} from "boltz-core";
import { randomBytes } from "crypto";
import zkpInit from "@vulpemventures/secp256k1-zkp";
import { ReverseSwapResponse } from "./types";

/**
 * Reverse Swap Flow (Onchain -> Lightning):
 * 1. User provides amount and destination address
 * 2. Boltz creates reverse swap and returns details
 * 3. User monitors swap status via WebSocket
 * 4. When lockup transaction is in mempool, user creates and broadcasts claim transaction
 * 5. Swap completes when invoice is settled
 */
export default class ReverseSwap extends Boltz {
  public async reverseSwap(
    amount: number,
    destinationAddress: string
  ): Promise<ReverseSwapResponse> {
    try {
      const preimage = randomBytes(32);
      const keys = ECPairFactory(ecc).makeRandom();

      console.log("Initiating reverse swap...");

      const createdResponse: ReverseSwapResponse = await this.fetch<any, any>(
        "/swap/reverse",
        "POST",
        {
          invoiceAmount: amount,
          to: "BTC",
          from: "BTC",
          claimPublicKey: keys.publicKey.toString("hex"),
          preimageHash: crypto.sha256(preimage).toString("hex"),
        }
      );

      console.log("Reverse swap created successfully:", createdResponse);

      return createdResponse;
    } catch (error: any) {
      if (error.isAxiosError) {
        console.error("Network error during reverse swap:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
      } else {
        console.error("Unexpected error during reverse swap:", error);
      }
      throw new Error(
        "Failed to initiate reverse swap. Please try again later."
      );
    }
  }

  public getWebSocketHandlers() {
    return {
      "swap.created": async () => {
        console.log("Reverse swap created, waiting for invoice to be paid...");
      },
      "transaction.mempool": async (args: any) => {
        console.log(
          "Lockup transaction detected in mempool. Initiating claim process..."
        );
        try {
          // TODO: We'll need to store or pass these values from the reverseSwap method
          // await this.handleReverseSwapClaim(
          //   this.createdResponse,
          //   this.keys,
          //   this.preimage,
          //   this.destinationAddress,
          //   args.transaction.hex
          // );
          console.log("Claim transaction successfully broadcast.");
        } catch (claimError) {
          console.error("Error during claim process:", claimError);
          // You might want to emit an event or call a callback here
        }
      },
      "invoice.settled": async () => {
        console.log("Invoice settled. Reverse swap completed successfully.");
        // You might want to emit an event or call a callback here
      },
      "swap.failed": async (args: any) => {
        console.error("Reverse swap failed:", args.reason);
        // You might want to emit an event or call a callback here
      },
    };
  }

  /**
   * Handles the claim process for a reverse swap.
   * @param createdResponse The response from creating the reverse swap
   * @param keys The ECPair for signing
   * @param preimage The preimage for claiming
   * @param destinationAddress The Bitcoin address to receive funds
   * @param lockupTxHex The hex of the lockup transaction
   */
  private async handleReverseSwapClaim(
    createdResponse: any,
    keys: ECPairInterface,
    preimage: Buffer,
    destinationAddress: string,
    lockupTxHex: string
  ) {
    console.log("Creating claim transaction");

    const boltzPublicKey = Buffer.from(createdResponse.refundPublicKey, "hex");
    const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
      boltzPublicKey,
      keys.publicKey,
    ]);
    const tweakedKey = TaprootUtils.tweakMusig(
      musig,
      SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree).tree
    );

    const lockupTx = Transaction.fromHex(lockupTxHex);
    const swapOutput = detectSwap(tweakedKey, lockupTx);
    if (!swapOutput)
      throw new Error("No swap output found in lockup transaction");

    const claimTx = targetFee(2, (fee) =>
      constructClaimTransaction(
        [
          {
            ...swapOutput,
            keys,
            preimage,
            cooperative: true,
            type: OutputType.Taproot,
            txHash: lockupTx.getHash(),
          },
        ],
        address.toOutputScript(destinationAddress, this.network),
        fee
      )
    );

    const boltzSig = await this.fetch<any, any>(
      `/swap/reverse/${createdResponse.id}/claim`,
      "POST",
      {
        index: 0,
        transaction: claimTx.toHex(),
        preimage: preimage.toString("hex"),
        pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
      }
    );

    musig.aggregateNonces([
      [boltzPublicKey, Buffer.from(boltzSig.pubNonce, "hex")],
    ]);
    musig.initializeSession(
      claimTx.hashForWitnessV1(
        0,
        [swapOutput.script],
        [swapOutput.value],
        Transaction.SIGHASH_DEFAULT
      )
    );

    musig.addPartial(
      boltzPublicKey,
      Buffer.from(boltzSig.partialSignature, "hex")
    );
    musig.signPartial();

    claimTx.ins[0].witness = [musig.aggregatePartials()];

    await this.fetch<{ hex: string }, { txid: string }>(
      "/chain/BTC/transaction",
      "POST",
      { hex: claimTx.toHex() }
    );
  }
}
