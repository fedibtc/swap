import BoltzBase from "./BoltzBase";
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
import {
  TaprootUtils as LiquidTaprootUtils,
  init,
} from "boltz-core/dist/lib/liquid";
import { randomBytes } from "crypto";
import zkpInit, { Secp256k1ZKP } from "@vulpemventures/secp256k1-zkp";

/**
 * Chain Swap Flow (Onchain BTC -> Onchain Liquid and vice versa):
 * 1. User provides amount, destination chain, preimage hash, and public keys
 * 2. Boltz creates chain swap and returns details
 * 3. User monitors swap status via WebSocket
 * 4. User sends funds to the provided lockup address
 * 5. Boltz locks funds on the destination chain
 * 6. User claims funds on the destination chain
 * 7. Boltz claims funds on the source chain
 */
export default class ChainSwap extends BoltzBase {
  /**
   * Initiates a chain swap from BTC to L-BTC (Liquid)
   * @param amount The amount in satoshis to swap
   * @param destinationAddress The Liquid address to receive L-BTC
   */
  public async chainSwapBTC2LQD(
    amount: number,
    destinationAddress: string
  ): Promise<void> {
    return this.chainSwap(amount, "BTC", "L-BTC", destinationAddress);
  }

  /**
   * Initiates a chain swap from L-BTC (Liquid) to BTC
   * @param amount The amount in satoshis to swap
   * @param destinationAddress The Bitcoin address to receive BTC
   */
  public async chainSwapLQD2BTC(
    amount: number,
    destinationAddress: string
  ): Promise<void> {
    return this.chainSwap(amount, "L-BTC", "BTC", destinationAddress);
  }

  /**
   * Initiates a chain swap (Chain -> Chain)
   * @param amount The amount in satoshis to swap
   * @param fromChain The source chain (e.g., "BTC" or "L-BTC")
   * @param toChain The destination chain (e.g., "BTC" or "L-BTC")
   * @param destinationAddress The address to receive funds on the destination chain
   */
  private async chainSwap(
    amount: number,
    fromChain: string,
    toChain: string,
    destinationAddress: string
  ): Promise<void> {
    const zkp = await zkpInit();
    init(zkp);

    const preimage = randomBytes(32);
    const claimKeys = ECPairFactory(ecc).makeRandom();
    const refundKeys = ECPairFactory(ecc).makeRandom();

    const createdResponse = await this.fetch<any, any>(
      "/v2/swap/chain",
      "POST",
      {
        userLockAmount: amount,
        to: toChain,
        from: fromChain,
        preimageHash: crypto.sha256(preimage).toString("hex"),
        claimPublicKey: claimKeys.publicKey.toString("hex"),
        refundPublicKey: refundKeys.publicKey.toString("hex"),
      }
    );

    console.log("Created chain swap:", createdResponse);

    const webSocket = this.createAndSubscribeToWebSocket(createdResponse.id);

    this.handleWebSocketMessage(webSocket, {
      "swap.created": async () => {
        console.log("Waiting for coins to be locked");
      },
      "transaction.server.mempool": async (args) => {
        console.log("Creating claim transaction");
        await this.handleChainSwapClaim(
          zkp,
          claimKeys,
          refundKeys,
          preimage,
          createdResponse,
          args.transaction.hex,
          destinationAddress
        );
      },
      "transaction.claimed": async () => {
        console.log("Chain swap successful");
        webSocket.close();
      },
    });
  }

  /**
   * Handles the claim process for a chain swap.
   * @param zkp The ZKP instance
   * @param claimKeys The ECPair for signing
   * @param refundKeys The ECPair for signing
   * @param preimage The preimage for claiming
   * @param createdResponse The response from creating the chain swap
   * @param lockupTransactionHex The hex of the lockup transaction
   * @param destinationAddress The address to receive funds on the destination chain
   */
  private async handleChainSwapClaim(
    zkp: Secp256k1ZKP,
    claimKeys: ECPairInterface,
    refundKeys: ECPairInterface,
    preimage: Buffer,
    createdResponse: any,
    lockupTransactionHex: string,
    destinationAddress: string
  ) {
    const claimDetails = this.createClaimTransaction(
      zkp,
      claimKeys,
      preimage,
      createdResponse,
      lockupTransactionHex,
      destinationAddress
    );

    const boltzPartialSig = await this.getBoltzPartialSignature(
      zkp,
      refundKeys,
      preimage,
      createdResponse,
      Buffer.from(claimDetails.musig.getPublicNonce()),
      claimDetails.transaction
    );

    claimDetails.musig.aggregateNonces([
      [claimDetails.boltzPublicKey, boltzPartialSig.pubNonce],
    ]);

    claimDetails.musig.initializeSession(
      claimDetails.transaction.hashForWitnessV1(
        0,
        [claimDetails.swapOutput.script],
        [claimDetails.swapOutput.value],
        Transaction.SIGHASH_DEFAULT
      )
    );

    claimDetails.musig.addPartial(
      claimDetails.boltzPublicKey,
      boltzPartialSig.partialSignature
    );

    claimDetails.musig.signPartial();

    claimDetails.transaction.ins[0].witness = [
      claimDetails.musig.aggregatePartials(),
    ];

    await this.fetch<{ hex: string }, { txid: string }>(
      `/v2/chain/${createdResponse.to}/transaction`,
      "POST",
      { hex: claimDetails.transaction.toHex() }
    );
  }

  /**
   * Creates a claim transaction for a chain swap.
   * @param zkp The ZKP instance
   * @param claimKeys The ECPair for signing
   * @param preimage The preimage for claiming
   * @param createdResponse The response from creating the chain swap
   * @param lockupTransactionHex The hex of the lockup transaction
   * @param destinationAddress The address to receive funds on the destination chain
   * @returns The claim transaction
   */
  private createClaimTransaction(
    zkp: Secp256k1ZKP,
    claimKeys: ECPairInterface,
    preimage: Buffer,
    createdResponse: any,
    lockupTransactionHex: string,
    destinationAddress: string
  ) {
    const boltzPublicKey = Buffer.from(
      createdResponse.claimDetails.serverPublicKey,
      "hex"
    );

    const musig = new Musig(zkp, claimKeys, randomBytes(32), [
      boltzPublicKey,
      claimKeys.publicKey,
    ]);
    const tweakedKey = LiquidTaprootUtils.tweakMusig(
      musig,
      SwapTreeSerializer.deserializeSwapTree(
        createdResponse.claimDetails.swapTree
      ).tree
    );

    const lockupTx = Transaction.fromHex(lockupTransactionHex);
    const swapOutput = detectSwap(tweakedKey, lockupTx);
    if (!swapOutput) {
      throw new Error("No swap output found in lockup transaction");
    }

    const transaction = targetFee(2, (fee) =>
      constructClaimTransaction(
        [
          {
            ...swapOutput,
            preimage,
            keys: claimKeys,
            cooperative: true,
            type: OutputType.Taproot,
            txHash: lockupTx.getHash(),
          },
        ],
        address.toOutputScript(destinationAddress, this.network),
        fee
      )
    );

    return { musig, transaction, swapOutput, boltzPublicKey };
  }

  /**
   * Gets the partial signature from the Boltz server for a chain swap.
   * @param zkp The ZKP instance
   * @param refundKeys The ECPair for signing
   * @param preimage The preimage for claiming
   * @param createdResponse The response from creating the chain swap
   * @param claimPubNonce The public nonce for the claim
   * @param claimTransaction The claim transaction
   * @returns The partial signature
   */
  private async getBoltzPartialSignature(
    zkp: Secp256k1ZKP,
    refundKeys: ECPairInterface,
    preimage: Buffer,
    createdResponse: any,
    claimPubNonce: Buffer,
    claimTransaction: Transaction
  ) {
    const serverClaimDetails = await this.fetch<{}, any>(
      `/v2/swap/chain/${createdResponse.id}/claim`,
      "GET"
    );

    const boltzPublicKey = Buffer.from(
      createdResponse.lockupDetails.serverPublicKey,
      "hex"
    );

    const musig = new Musig(zkp, refundKeys, randomBytes(32), [
      boltzPublicKey,
      refundKeys.publicKey,
    ]);
    TaprootUtils.tweakMusig(
      musig,
      SwapTreeSerializer.deserializeSwapTree(
        createdResponse.lockupDetails.swapTree
      ).tree
    );

    musig.aggregateNonces([
      [boltzPublicKey, Buffer.from(serverClaimDetails.pubNonce, "hex")],
    ]);
    musig.initializeSession(
      Buffer.from(serverClaimDetails.transactionHash, "hex")
    );
    const partialSig = musig.signPartial();

    const ourClaimDetails = await this.fetch<any, any>(
      `/v2/swap/chain/${createdResponse.id}/claim`,
      "POST",
      {
        preimage: preimage.toString("hex"),
        signature: {
          partialSignature: Buffer.from(partialSig).toString("hex"),
          pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
        },
        toSign: {
          index: 0,
          transaction: claimTransaction.toHex(),
          pubNonce: claimPubNonce.toString("hex"),
        },
      }
    );

    return {
      pubNonce: Buffer.from(ourClaimDetails.pubNonce, "hex"),
      partialSignature: Buffer.from(ourClaimDetails.partialSignature, "hex"),
    };
  }
}
