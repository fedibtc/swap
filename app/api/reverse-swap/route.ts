import { formatError } from "@/lib/errors";
import { z } from "zod";
import zkpInit from "@vulpemventures/secp256k1-zkp";
import axios from "axios";
import {
  Transaction,
  address,
  crypto,
  initEccLib,
  networks,
} from "bitcoinjs-lib";
import {
  Musig,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
  constructClaimTransaction,
  detectSwap,
  targetFee,
} from "boltz-core";
import { randomBytes } from "crypto";
import { ECPairFactory } from "ecpair";
import ws from "ws";
import { ReverseSwapMessage } from "./types";
import ecc from "@bitcoinerlab/secp256k1";

const paramsSchema = z.object({
  address: z.string(),
  amount: z.string().regex(/^\d+$/),
});

const endpoint = "https://api.boltz.exchange";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const { address: destinationAddress, amount } = paramsSchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );
    const invoiceAmount = Number(amount);

    if (!destinationAddress) throw new Error("No address provided");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendData(data: ReverseSwapMessage) {
          const formattedData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(formattedData));
        }

        initEccLib(ecc);
        // Create a random preimage for the swap; has to have a length of 32 bytes
        const preimage = randomBytes(32);
        const keys = ECPairFactory(ecc).makeRandom();

        // Create a Submarine Swap
        const createdResponse = (
          await axios.post(`${endpoint}/v2/swap/reverse`, {
            invoiceAmount,
            to: "BTC",
            from: "BTC",
            claimPublicKey: keys.publicKey.toString("hex"),
            preimageHash: crypto.sha256(preimage).toString("hex"),
          })
        ).data;

        console.log(createdResponse);
        console.log("Created Response");

        sendData({
          status: "created",
          data: createdResponse,
        });

        // Create a WebSocket and subscribe to updates for the created swap
        const webSocket = new ws(
          `${endpoint.replace("https://", "wss://")}/v2/ws`,
        );

        webSocket.on("open", () => {
          webSocket.send(
            JSON.stringify({
              op: "subscribe",
              channel: "swap.update",
              args: [createdResponse.id],
            }),
          );
        });

        webSocket.on("message", async (rawMsg) => {
          const msg = JSON.parse(rawMsg.toString("utf-8"));
          if (msg.event !== "update") {
            return;
          }

          switch (msg.args[0].status) {
            case "transaction.mempool": {
              sendData({
                status: "pending",
              });

              const boltzPublicKey = Buffer.from(
                createdResponse.refundPublicKey,
                "hex",
              );

              // Create a musig signing session and tweak it with the Taptree of the swap scripts
              const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
                boltzPublicKey,
                keys.publicKey,
              ]);
              const tweakedKey = TaprootUtils.tweakMusig(
                musig,
                SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree)
                  .tree,
              );

              // Parse the lockup transaction and find the output relevant for the swap
              const lockupTx = Transaction.fromHex(msg.args[0].transaction.hex);
              const swapOutput = detectSwap(tweakedKey, lockupTx);
              if (swapOutput === undefined) {
                return;
              }

              // Create a claim transaction to be signed cooperatively via a key path spend
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
                  address.toOutputScript(destinationAddress, networks.bitcoin),
                  fee,
                ),
              );

              // Get the partial signature from Boltz
              const boltzSig = (
                await axios.post(
                  `${endpoint}/v2/swap/reverse/${createdResponse.id}/claim`,
                  {
                    index: 0,
                    transaction: claimTx.toHex(),
                    preimage: preimage.toString("hex"),
                    pubNonce: Buffer.from(musig.getPublicNonce()).toString(
                      "hex",
                    ),
                  },
                )
              ).data;

              // Aggregate the nonces
              musig.aggregateNonces([
                [boltzPublicKey, Buffer.from(boltzSig.pubNonce, "hex")],
              ]);

              // Initialize the session to sign the claim transaction
              musig.initializeSession(
                claimTx.hashForWitnessV1(
                  0,
                  [swapOutput.script],
                  [swapOutput.value],
                  Transaction.SIGHASH_DEFAULT,
                ),
              );

              // Add the partial signature from Boltz
              musig.addPartial(
                boltzPublicKey,
                Buffer.from(boltzSig.partialSignature, "hex"),
              );

              // Create our partial signature
              musig.signPartial();

              // Witness of the input to the aggregated signature
              claimTx.ins[0].witness = [musig.aggregatePartials()];

              // Broadcast the finalized transaction
              await axios.post(`${endpoint}/v2/chain/BTC/transaction`, {
                hex: claimTx.toHex(),
              });

              break;
            }

            case "invoice.settled":
              sendData({
                status: "done",
              });
              break;
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(formatError(e), { status: 400 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
