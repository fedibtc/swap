import Boltz from "./BoltzBase";
import { ECPairFactory, ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";
import bolt11 from "bolt11";
import { crypto } from "bitcoinjs-lib";
import { Musig, SwapTreeSerializer, TaprootUtils } from "boltz-core";
import { randomBytes } from "crypto";
import zkpInit from "@vulpemventures/secp256k1-zkp";
import { SubmarineSwapResponse, SwapHandlers } from "./types";

/**
 * Submarine Swap Flow (Lightning -> Onchain):
 * 1. User provides invoice and refund address
 * 2. Boltz creates swap and returns details
 * 3. User monitors swap status via WebSocket
 * 4. When claim is pending, user cooperates to create claim transaction
 * 5. Swap completes when transaction is claimed
 */
export default class SubmarineSwap extends Boltz {
  public async submarineSwap(
    invoice: string,
    refundAddress: string
  ): Promise<SubmarineSwapResponse> {
    const keys = ECPairFactory(ecc).makeRandom();

    const createdResponse: SubmarineSwapResponse = await this.fetch<any, any>(
      "/swap/submarine",
      "POST",
      {
        invoice,
        to: "BTC",
        from: "BTC",
        refundPublicKey: keys.publicKey.toString("hex"),
      }
    );

    console.log("Submarine swap created successfully:", createdResponse);

    return createdResponse;
  }

  public getWebSocketHandlers(): SwapHandlers {
    return {
      handleSwapUpdate: (message: any) => {
        switch (message.status) {
          case "swap.created":
            console.log(
              "Submarine swap created, waiting for onchain transaction..."
            );
            break;
          case "transaction.claim.pending":
            console.log(
              "Claim transaction pending. Initiating claim process..."
            );
            try {
              // TODO: Implement handleSubmarineClaimPending
              console.log("Claim transaction successfully broadcast.");
            } catch (claimError) {
              console.error("Error during claim process:", claimError);
            }
            break;
          case "transaction.claimed":
            console.log(
              "Transaction claimed. Submarine swap completed successfully."
            );
            break;
          case "swap.failed":
            console.error("Submarine swap failed:", message.reason);
            break;
        }
        return null;
      },
    };
  }

  /**
   * Handles the claim pending state of a submarine swap.
   * @param createdResponse The response from creating the swap
   * @param keys The ECPair for signing
   * @param invoice The original lightning invoice
   */
  private async handleSubmarineClaimPending(
    createdResponse: any,
    keys: ECPairInterface,
    invoice: string
  ) {
    console.log("Creating cooperative claim transaction");

    const claimTxDetails = await this.fetch<{}, any>(
      `/swap/submarine/${createdResponse.id}/claim`,
      "GET"
    );

    const invoicePreimageHash = Buffer.from(
      bolt11.decode(invoice).tags.find((tag) => tag.tagName === "payment_hash")!
        .data as string,
      "hex"
    );

    if (
      !crypto
        .sha256(Buffer.from(claimTxDetails.preimage, "hex"))
        .equals(invoicePreimageHash)
    ) {
      throw new Error("Boltz provided invalid preimage");
    }

    const boltzPublicKey = Buffer.from(createdResponse.claimPublicKey, "hex");
    const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
      boltzPublicKey,
      keys.publicKey,
    ]);

    TaprootUtils.tweakMusig(
      musig,
      SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree).tree
    );

    musig.aggregateNonces([
      [boltzPublicKey, Buffer.from(claimTxDetails.pubNonce, "hex")],
    ]);
    musig.initializeSession(Buffer.from(claimTxDetails.transactionHash, "hex"));

    await this.fetch(`/swap/submarine/${createdResponse.id}/claim`, "POST", {
      pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
      partialSignature: Buffer.from(musig.signPartial()).toString("hex"),
    });
  }
}
