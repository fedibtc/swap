"use client";

import {
  Direction,
  useAppState,
} from "@/app/components/providers/app-state-provider";
import Container from "@/app/components/container";
import { useCallback, useEffect, useState } from "react";
import Flex from "@/app/components/ui/flex";
import { ProgressStep } from "../status/pending/step";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Button, Icon, Text } from "@fedibtc/ui";
import { BorderContainer, PayNotice } from "./pay-notice";
import { PaidNotice } from "../status/pending/paid-notice";
import Image from "next/image";
import zkpInit from "@vulpemventures/secp256k1-zkp";
import { Transaction, address, networks } from "bitcoinjs-lib";
import {
  Musig,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
  constructClaimTransaction,
  detectSwap,
} from "boltz-core";
import { randomBytes } from "crypto";
import { BoltzStatus, boltzStatusSteps } from "@/lib/constants";
import SwapIndicator from "@/app/components/swap-indicator";
import { useBoltz } from "@/app/components/providers/boltz-provider";
import { boltz as boltzApi } from "@/lib/boltz";

export default function FromLnStatus() {
  const [status, setStatus] = useState<BoltzStatus>("created");
  const { webln, draftAmount, draftAddress } = useAppState();
  const boltz = useBoltz();

  if (
    !boltz ||
    boltz.swap?.direction !== Direction.FromLightning ||
    !draftAmount ||
    !draftAddress
  )
    throw new Error("Invalid boltz swap state");

  const {
    swap: { swap, preimage, keypair },
  } = boltz;

  const determineStepStatus = useCallback(
    (step: BoltzStatus) => {
      if (status === step) {
        return "loading";
      } else if (
        boltzStatusSteps.indexOf(status) > boltzStatusSteps.indexOf(step)
      ) {
        return "success";
      } else {
        return "idle";
      }
    },
    [status],
  );

  useEffect(() => {
    if (!swap || !preimage || !keypair) return;

    let webSocket = new WebSocket(`wss://api.boltz.exchange/v2/ws`);

    webSocket.onopen = () => {
      webSocket.send(
        JSON.stringify({
          op: "subscribe",
          channel: "swap.update",
          args: [swap.id],
        }),
      );
    };

    webSocket.onclose = () => {
      webSocket = new WebSocket(`wss://api.boltz.exchange/v2/ws`);
    };

    webSocket.onmessage = async (message) => {
      const msg = JSON.parse(message.data);
      if (msg.event !== "update") {
        return;
      }

      switch (msg.args[0].status) {
        case "transaction.mempool": {
          setStatus("pending");

          const boltzPublicKey = Buffer.from(swap.refundPublicKey, "hex");

          const secp = await zkpInit();

          // Create a musig signing session and tweak it with the Taptree of the swap scripts
          const musig = new Musig(secp, keypair, randomBytes(32), [
            boltzPublicKey,
            keypair.publicKey,
          ]);
          const tweakedKey = TaprootUtils.tweakMusig(
            musig,
            SwapTreeSerializer.deserializeSwapTree(swap.swapTree).tree,
          );

          // Parse the lockup transaction and find the output relevant for the swap
          const lockupTx = Transaction.fromHex(msg.args[0].transaction.hex);
          const swapOutput = detectSwap(tweakedKey, lockupTx);
          if (swapOutput === undefined) {
            return;
          }

          // Create a claim transaction to be signed cooperatively via a key path spend
          const input = {
            ...swapOutput,
            keys: keypair,
            preimage,
            cooperative: true,
            type: OutputType.Taproot,
            txHash: lockupTx.getHash(),
          };

          const feeBudget = Number(input.value) - draftAmount;

          const claimTx = constructClaimTransaction(
            [input],
            address.toOutputScript(draftAddress, networks.bitcoin),
            feeBudget,
          );

          // Get the partial signature from Boltz
          const boltzSig = await boltzApi.claimReverseSwap(swap.id, {
            index: 0,
            transaction: claimTx.toHex(),
            preimage: preimage.toString("hex"),
            pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
          });

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
          await boltzApi.broadcastClaimedTransaction(claimTx.toHex());

          break;
        }

        case "invoice.settled":
          setStatus("done");
          webSocket.close();
          break;
      }
    };

    return () => {
      webSocket.close();
    };
  }, [swap, draftAmount, draftAddress, keypair, preimage]);

  useEffect(() => {
    if (!swap || !webln) return;

    webln.sendPayment(swap.invoice).catch(() => {});
  }, [swap, webln]);

  return (
    <Container className="p-4">
      <SwapIndicator />
      {status === "done" ? (
        <Flex grow col width="full">
          <Flex grow col gap={4}>
            <BorderContainer>
              <Image src="/logo.png" alt="Logo" width={64} height={64} />
              <Text variant="h2" weight="medium">
                Exchange Complete
              </Text>
              <Text className="text-center">
                Successfully swapped <strong>{draftAmount} sats</strong> from
                Lightning to Onchain Bitcoin
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
          {status === "created" && swap && <PayNotice order={swap} />}
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
