import { formatError } from "@/lib/errors";
import zkpInit from "@vulpemventures/secp256k1-zkp";
import axios from "axios";
import { crypto, initEccLib } from "bitcoinjs-lib";
import bolt11 from "bolt11";
import { Musig, SwapTreeSerializer, TaprootUtils } from "boltz-core";
import { randomBytes } from "crypto";
import { ECPairFactory } from "ecpair";
import ws from "ws";
import { z } from "zod";

const paramsSchema = z.object({
  invoice: z.string(),
});

const endpoint = "https://api.boltz.exchange";

export async function GET(req: Request) {
  const ecc = await import("tiny-secp256k1");

  try {
    const url = new URL(req.url);

    const { invoice } = paramsSchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendData(data: any) {
          const formattedData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(formattedData));
        }

        initEccLib(ecc);

        const keys = ECPairFactory(ecc).makeRandom();

        // Create a Submarine Swap
        const createdResponse = (
          await axios.post(`${endpoint}/v2/swap/submarine`, {
            invoice,
            to: "BTC",
            from: "BTC",
            refundPublicKey: keys.publicKey.toString("hex"),
          })
        ).data;

        console.log("Created swap");
        console.log(createdResponse);

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
            case "transaction.mempool":
              {
                sendData({
                  status: "pending",
                });
              }
              break;
            // Create a partial signature to allow Boltz to do a key path spend to claim the mainchain coins
            case "transaction.claim.pending": {
              // Get the information request to create a partial signature
              const claimTxDetails = (
                await axios.get(
                  `${endpoint}/v2/swap/submarine/${createdResponse.id}/claim`,
                )
              ).data;

              // Verify that Boltz actually paid the invoice by comparing the preimage hash
              // of the invoice to the SHA256 hash of the preimage from the response
              const invoicePreimageHash = Buffer.from(
                bolt11
                  .decode(invoice)
                  .tags.find((tag) => tag.tagName === "payment_hash")!
                  .data as string,
                "hex",
              );
              if (
                !crypto
                  .sha256(Buffer.from(claimTxDetails.preimage, "hex"))
                  .equals(invoicePreimageHash)
              ) {
                return;
              }

              const boltzPublicKey = Buffer.from(
                createdResponse.claimPublicKey,
                "hex",
              );

              // Create a musig signing instance
              const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
                boltzPublicKey,
                keys.publicKey,
              ]);
              // Tweak that musig with the Taptree of the swap scripts
              TaprootUtils.tweakMusig(
                musig,
                SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree)
                  .tree,
              );

              // Aggregate the nonces
              musig.aggregateNonces([
                [boltzPublicKey, Buffer.from(claimTxDetails.pubNonce, "hex")],
              ]);
              // Initialize the session to sign the transaction hash from the response
              musig.initializeSession(
                Buffer.from(claimTxDetails.transactionHash, "hex"),
              );

              // Give our public nonce and the partial signature to Boltz
              await axios.post(
                `${endpoint}/v2/swap/submarine/${createdResponse.id}/claim`,
                {
                  pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
                  partialSignature: Buffer.from(musig.signPartial()).toString(
                    "hex",
                  ),
                },
              );

              console.log("Claimed");
              break;
            }

            case "transaction.claimed":
              console.log("Done");
              sendData({
                status: "done",
              });
              webSocket.close();
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
