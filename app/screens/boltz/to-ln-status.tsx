"use client";

import { Direction } from "@/app/components/providers/app-state-provider";
import Container from "@/app/components/container";
import { useEffect, useRef, useState } from "react";
import Flex from "@/app/components/ui/flex";
import { ProgressStep } from "../status/pending/step";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Button, Icon, Text } from "@fedibtc/ui";
import { BorderContainer, PayNotice } from "./pay-notice";
import { PaidNotice } from "../status/pending/paid-notice";
import { SubmarineSwapResponse } from "@/lib/types";
import Image from "next/image";
import zkpInit from "@vulpemventures/secp256k1-zkp";
import axios from "axios";
import { crypto, initEccLib } from "bitcoinjs-lib";
import bolt11 from "bolt11";
import { Musig, SwapTreeSerializer, TaprootUtils } from "boltz-core";
import { randomBytes } from "crypto";
import { ECPairFactory } from "ecpair";
import { BoltzStatus, boltzEndpoint, boltzStatusSteps } from "@/lib/constants";
import ecc from "@bitcoinerlab/secp256k1";
import CoinHeader from "@/app/components/coin-header";
import { BoltzSwapToLn, useBoltz } from "@/app/components/providers/boltz-provider";

export default function ToLnStatus() {
  const [status, setStatus] = useState<BoltzStatus>("new");
  const [order, setOrder] = useState<SubmarineSwapResponse | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const boltz = useBoltz();

  if (!boltz || boltz.swap?.direction !== Direction.ToLightning)
    throw new Error("Invalid boltz swap state");

  const swap = boltz.swap as BoltzSwapToLn;

  const determineStepStatus = (step: BoltzStatus) => {
    if (status === step) {
      return "loading";
    } else if (
      boltzStatusSteps.indexOf(status) > boltzStatusSteps.indexOf(step)
    ) {
      return "success";
    } else {
      return "idle";
    }
  };

  useEffect(() => {
    async function startSwap() {
      if (status !== "new") return;

      initEccLib(ecc);

      const keys = ECPairFactory(ecc).makeRandom();

      console.log(keys, "KEYS");
      console.log(keys.publicKey.toString("hex"), "PUBKEY");
      console.log(swap, "EXCHANGE ORDER");

      // Create a Submarine Swap
      const createdResponse = (
        await axios.post(`${boltzEndpoint}/v2/swap/submarine`, {
          invoice: swap.invoice,
          to: "BTC",
          from: "BTC",
          refundPublicKey: keys.publicKey.toString("hex"),
        })
      ).data;

      setStatus("created");
      setOrder(createdResponse);

      console.log("Created swap");
      console.log(createdResponse);

      let webSocket: WebSocket;

      if (!wsRef.current) {
        wsRef.current = new WebSocket(
          `${boltzEndpoint.replace("https://", "wss://")}/v2/ws`
        );
      }

      webSocket = wsRef.current;

      webSocket.onopen = () => {
        webSocket.send(
          JSON.stringify({
            op: "subscribe",
            channel: "swap.update",
            args: [createdResponse.id],
          })
        );
      };

      webSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      webSocket.onmessage = async (message) => {
        const msg = JSON.parse(message.data);
        if (msg.event !== "update") {
          return;
        }

        console.log(message, "MESSAGE");
        console.log(msg, "MSG");

        switch (msg.args[0].status) {
          case "transaction.mempool":
            setStatus("pending");
            break;
          // Create a partial signature to allow Boltz to do a key path spend to claim the mainchain coins
          case "transaction.claim.pending": {
            // Get the information request to create a partial signature
            const claimTxDetails = (
              await axios.get(
                `${boltzEndpoint}/v2/swap/submarine/${createdResponse.id}/claim`
              )
            ).data;

            // Verify that Boltz actually paid the invoice by comparing the preimage hash
            // of the invoice to the SHA256 hash of the preimage from the response
            const invoicePreimageHash = Buffer.from(
              bolt11
                .decode(swap.invoice)
                .tags.find((tag) => tag.tagName === "payment_hash")!
                .data as string,
              "hex"
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
              "hex"
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
                .tree
            );

            // Aggregate the nonces
            musig.aggregateNonces([
              [boltzPublicKey, Buffer.from(claimTxDetails.pubNonce, "hex")],
            ]);
            // Initialize the session to sign the transaction hash from the response
            musig.initializeSession(
              Buffer.from(claimTxDetails.transactionHash, "hex")
            );

            // Give our public nonce and the partial signature to Boltz
            await axios.post(
              `${boltzEndpoint}/v2/swap/submarine/${createdResponse.id}/claim`,
              {
                pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
                partialSignature: Buffer.from(musig.signPartial()).toString(
                  "hex"
                ),
              }
            );

            console.log("Claimed");
            break;
          }

          case "transaction.claimed":
            setStatus("done");
            webSocket.close();
            break;
        }
      };
    }

    if (swap && status === "new") {
      startSwap();
    }
  }, [swap, status]);

  return (
    <Container className="p-4">
      <CoinHeader />
      {status === "done" ? (
        <Flex grow col width="full">
          <Flex grow col gap={4}>
            <BorderContainer>
              <Image src="/logo.png" alt="Logo" width={64} height={64} />
              <Text variant="h2" weight="medium">
                Exchange Complete
              </Text>
              <Text className="text-center">
                Successfully swapped{" "}
                <strong>{swap.amount} sats</strong> from Onchain
                Bitcoin to Lightning
              </Text>
            </BorderContainer>
          </Flex>
          <Button onClick={() => window.location.reload()}>Done</Button>
        </Flex>
      ) : (
        <Flex grow col gap={4} className="w-full">
          <Flex row align="center" gap={1}>
            <ProgressStep status={determineStepStatus("new")} text="Initiate" />
            <ProgressStep
              status={determineStepStatus("created")}
              text="Deposit"
            />
            <ProgressStep
              status={determineStepStatus("pending")}
              text="Confirming"
            />
            <ProgressStep status={determineStepStatus("done")} text="Done" />
          </Flex>
          {status === "created" && order && <PayNotice order={order} />}
          {status === "pending" && <PaidNotice />}
        </Flex>
      )}
      {status !== "done" && status !== "pending" ? (
        <StatusBanner status="warning" className="w-full">
          <Icon icon="IconInfoTriangle" className="w-6 h-6 shrink-0" />
          <Text>Warning: Do not close this page</Text>
        </StatusBanner>
      ) : null}
      {status === "pending" ? (
        <StatusBanner status="info" className="w-full">
          <Icon icon="IconInfoCircle" className="w-6 h-6 shrink-0" />
          <Text>
            Block confirmations can take a while. You can close this page while
            the swap continues in the background.
          </Text>
        </StatusBanner>
      ) : null}
    </Container>
  );
}
