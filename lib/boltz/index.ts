import zkpInit, { Secp256k1ZKP } from "@vulpemventures/secp256k1-zkp";
import axios from "axios";
import {
  crypto,
  networks,
  Transaction,
  address,
  initEccLib,
} from "bitcoinjs-lib";
import bolt11 from "bolt11";
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
  constructClaimTransaction as LiquidConstructClaimTransaction,
  init,
} from "boltz-core/dist/lib/liquid";
import { randomBytes } from "crypto";
import { ECPairFactory, ECPairInterface } from "ecpair";
import * as ecc from "tiny-secp256k1";
import WebSocket from "ws";

/**
 * Boltz class for handling submarine and reverse swaps.
 *
 * Submarine Swap Flow (Lightning -> Onchain):
 * 1. User provides invoice and refund address
 * 2. Boltz creates swap and returns details
 * 3. User monitors swap status via WebSocket
 * 4. When claim is pending, user cooperates to create claim transaction
 * 5. Swap completes when transaction is claimed
 *
 * Reverse Swap Flow (Onchain -> Lightning):
 * 1. User provides amount and destination address
 * 2. Boltz creates reverse swap and returns details
 * 3. User monitors swap status via WebSocket
 * 4. When lockup transaction is in mempool, user creates and broadcasts claim transaction
 * 5. Swap completes when invoice is settled
 *
 * Chain Swap Flow (Onchain BTC -> Onchain Liquid and vice versa):
 * 1. User provides amount, destination chain, preimage hash, and public keys
 * 2. Boltz creates chain swap and returns details
 * 3. User monitors swap status via WebSocket
 * 4. User sends funds to the provided lockup address
 * 5. Boltz locks funds on the destination chain
 * 6. User claims funds on the destination chain
 * 7. Boltz claims funds on the source chain
 */
export default class Boltz {
  private endpoint: string;
  private network: networks.Network;

  constructor(endpoint: string, network: networks.Network = networks.bitcoin) {
    this.endpoint = endpoint;
    this.network = network;
    initEccLib(ecc);
  }

  private async fetch<Req extends {}, Res extends {}>(
    path: string,
    method: "GET" | "POST",
    body?: Req
  ): Promise<Res> {
    const url = `${this.endpoint}${path}`;
    const config = {
      method,
      url,
      data: body,
      headers: { "Content-Type": "application/json" },
    };

    const response = await axios(config);
    return response.data;
  }

  /**
   * Initiates a submarine swap, Onchain -> Lightning
   * @param invoice Lightning invoice to be paid
   * @param refundAddress Bitcoin address for refund in case of failure
   */
  public async submarineSwap(
    invoice: string,
    refundAddress: string
  ): Promise<void> {
    const keys = ECPairFactory(ecc).makeRandom();

    const createdResponse = await this.fetch<any, any>(
      "/v2/swap/submarine",
      "POST",
      {
        invoice,
        to: "BTC",
        from: "BTC",
        refundPublicKey: keys.publicKey.toString("hex"),
      }
    );

    console.log("Created swap:", createdResponse);

    const webSocket = this.createWebSocket();
    webSocket.on("open", () => {
      webSocket.send(
        JSON.stringify({
          op: "subscribe",
          channel: "swap.update",
          args: [createdResponse.id],
        })
      );
    });

    webSocket.on("message", async (rawMsg) => {
      const msg = JSON.parse(rawMsg.toString("utf-8"));
      if (msg.event !== "update") return;

      console.log("WebSocket update:", msg);

      switch (msg.args[0].status) {
        case "invoice.set":
          // TODO: User pays the onchain transaction returned here
          console.log("Waiting for onchain transaction");
          break;

        case "transaction.claim.pending":
          await this.handleSubmarineClaimPending(
            createdResponse,
            keys,
            invoice
          );
          break;

        case "transaction.claimed":
          console.log("Swap successful");
          webSocket.close();
          break;
      }
    });
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
      `/v2/swap/submarine/${createdResponse.id}/claim`,
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

    await this.fetch(`/v2/swap/submarine/${createdResponse.id}/claim`, "POST", {
      pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
      partialSignature: Buffer.from(musig.signPartial()).toString("hex"),
    });
  }

  /**
   * Initiates a reverse swap.
   * @param amount The amount in satoshis to swap
   * @param destinationAddress The Bitcoin address to receive funds
   */
  public async reverseSwap(
    amount: number,
    destinationAddress: string
  ): Promise<void> {
    const preimage = randomBytes(32);
    const keys = ECPairFactory(ecc).makeRandom();

    const createdResponse = await this.fetch<any, any>(
      "/v2/swap/reverse",
      "POST",
      {
        invoiceAmount: amount,
        to: "BTC",
        from: "BTC",
        claimPublicKey: keys.publicKey.toString("hex"),
        preimageHash: crypto.sha256(preimage).toString("hex"),
      }
    );

    console.log("Created reverse swap:", createdResponse);

    const webSocket = this.createWebSocket();
    webSocket.on("open", () => {
      webSocket.send(
        JSON.stringify({
          op: "subscribe",
          channel: "swap.update",
          args: [createdResponse.id],
        })
      );
    });

    webSocket.on("message", async (rawMsg) => {
      const msg = JSON.parse(rawMsg.toString("utf-8"));
      if (msg.event !== "update") return;

      console.log("WebSocket update:", msg);

      switch (msg.args[0].status) {
        case "swap.created":
          // TODO: User pays the lightning invoice returned here
          console.log("Waiting for invoice to be paid");
          break;

        case "transaction.mempool":
          await this.handleReverseSwapClaim(
            createdResponse,
            keys,
            preimage,
            destinationAddress,
            msg.args[0].transaction.hex
          );
          break;

        case "invoice.settled":
          console.log("Swap successful");
          webSocket.close();
          break;
      }
    });
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
      `/v2/swap/reverse/${createdResponse.id}/claim`,
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
      "/v2/chain/BTC/transaction",
      "POST",
      { hex: claimTx.toHex() }
    );
  }

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
  public async chainSwap(
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

    const webSocket = this.createWebSocket();
    webSocket.on("open", () => {
      webSocket.send(
        JSON.stringify({
          op: "subscribe",
          channel: "swap.update",
          args: [createdResponse.id],
        })
      );
    });

    webSocket.on("message", async (rawMsg) => {
      const msg = JSON.parse(rawMsg.toString("utf-8"));
      if (msg.event !== "update") return;

      console.log("WebSocket update:", msg);

      switch (msg.args[0].status) {
        case "swap.created":
          console.log("Waiting for coins to be locked");
          break;

        case "transaction.server.mempool":
          console.log("Creating claim transaction");
          await this.handleChainSwapClaim(
            zkp,
            claimKeys,
            refundKeys,
            preimage,
            createdResponse,
            msg.args[0].transaction.hex,
            destinationAddress
          );
          break;

        case "transaction.claimed":
          console.log("Chain swap successful");
          webSocket.close();
          break;
      }
    });
  }

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

  private createWebSocket(): WebSocket {
    return new WebSocket(`${this.endpoint.replace("http://", "ws://")}/v2/ws`);
  }
}
