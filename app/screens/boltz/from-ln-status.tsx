"use client";

import {
  AppStateBoltzFromLn,
  useAppState,
} from "@/app/components/app-state-provider";
import Container from "@/app/components/container";
import { useEffect, useRef, useState } from "react";
import Flex from "@/app/components/ui/flex";
import { ProgressStep } from "../status/pending/step";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Button, Icon, Text } from "@fedibtc/ui";
import { BorderContainer, PayNotice } from "./pay-notice";
import { PaidNotice } from "../status/pending/paid-notice";
import { ReverseSwapResponse } from "@/lib/types";
import Image from "next/image";
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
import ecc from "@bitcoinerlab/secp256k1";
import { BoltzStatus, boltzEndpoint, boltzStatusSteps } from "@/lib/constants";
import CoinHeader from "@/app/components/coin-header";

export default function FromLnStatus() {
  const [status, setStatus] = useState<BoltzStatus>("new");
  const [order, setOrder] = useState<ReverseSwapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { exchangeOrder, webln } = useAppState<AppStateBoltzFromLn>();

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
      if (!exchangeOrder || status !== "new") return;

      initEccLib(ecc);

      // Create a random preimage for the swap; has to have a length of 32 bytes
      const preimage = randomBytes(32);
      const keys = ECPairFactory(ecc).makeRandom();

      // Create a Submarine Swap
      const createdResponse = (
        await axios.post(`${boltzEndpoint}/v2/swap/reverse`, {
          invoiceAmount: exchangeOrder.amount,
          to: "BTC",
          from: "BTC",
          claimPublicKey: keys.publicKey.toString("hex"),
          preimageHash: crypto.sha256(preimage).toString("hex"),
        })
      ).data;

      console.log(createdResponse);
      console.log("Created Response");

      setStatus("created");
      setOrder(createdResponse);

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

        switch (msg.args[0].status) {
          case "transaction.mempool": {
            setStatus("pending");

            const boltzPublicKey = Buffer.from(
              createdResponse.refundPublicKey,
              "hex"
            );

            // Create a musig signing session and tweak it with the Taptree of the swap scripts
            const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
              boltzPublicKey,
              keys.publicKey,
            ]);
            const tweakedKey = TaprootUtils.tweakMusig(
              musig,
              SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree)
                .tree
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
                address.toOutputScript(exchangeOrder.address, networks.bitcoin),
                fee
              )
            );

            // Get the partial signature from Boltz
            const boltzSig = (
              await axios.post(
                `${boltzEndpoint}/v2/swap/reverse/${createdResponse.id}/claim`,
                {
                  index: 0,
                  transaction: claimTx.toHex(),
                  preimage: preimage.toString("hex"),
                  pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
                }
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
                Transaction.SIGHASH_DEFAULT
              )
            );

            // Add the partial signature from Boltz
            musig.addPartial(
              boltzPublicKey,
              Buffer.from(boltzSig.partialSignature, "hex")
            );

            // Create our partial signature
            musig.signPartial();

            // Witness of the input to the aggregated signature
            claimTx.ins[0].witness = [musig.aggregatePartials()];

            // Broadcast the finalized transaction
            await axios.post(`${boltzEndpoint}/v2/chain/BTC/transaction`, {
              hex: claimTx.toHex(),
            });

            break;
          }

          case "invoice.settled":
            setStatus("done");
            webSocket.close();
            break;
        }
      };
    }

    if (exchangeOrder && status === "new") {
      startSwap();
    }
  }, [exchangeOrder, status]);

  useEffect(() => {
    if (!order) return;

    if (webln) {
      webln.sendPayment(order.invoice).catch(() => {});
    }
  }, [order, webln]);

  return error ? (
    <Container>
      <Text variant="h2" weight="medium">
        An Error Occurred
      </Text>
      <Text className="text-center">{error}</Text>
    </Container>
  ) : (
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
                <strong>{exchangeOrder?.amount} sats</strong> from Lightning to
                Onchain Bitcoin
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
      {status !== "done" ? (
        <StatusBanner status="warning" className="w-full">
          <Icon icon="IconInfoTriangle" className="w-6 h-6 shrink-0" />
          <Text>Warning: Do not close this page</Text>
        </StatusBanner>
      ) : null}
    </Container>
  );
}
