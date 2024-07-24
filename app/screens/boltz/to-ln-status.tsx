"use client";

import {
  AppStateBoltzToLn,
  useAppState,
} from "@/app/components/app-state-provider";
import Container from "@/app/components/container";
import SwapIndicator from "@/app/components/swap-indicator";
import { useEffect, useState } from "react";
import Flex from "@/app/components/ui/flex";
import { ProgressStep } from "../status/pending/step";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Button, Icon, Text } from "@fedibtc/ui";
import { BorderContainer, PayNotice } from "./pay-notice";
import { PaidNotice } from "../status/pending/paid-notice";
import { SubmarineSwapResponse } from "@/lib/types";
import Image from "next/image";
import { SubmarineSwapMessage } from "@/app/api/submarine-swap/types";

const statusSteps = ["new", "created", "pending", "done"];

type Status = (typeof statusSteps)[number];

export default function ToLnStatus() {
  const [status, setStatus] = useState<Status>("new");
  const [order, setOrder] = useState<SubmarineSwapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { exchangeOrder } = useAppState<AppStateBoltzToLn>();

  const determineStepStatus = (step: Status) => {
    if (status === step) {
      return "loading";
    } else if (statusSteps.indexOf(status) > statusSteps.indexOf(step)) {
      return "success";
    } else {
      return "idle";
    }
  };

  useEffect(() => {
    if (!exchangeOrder) return;

    let eventSource: EventSource | null = null;

    const connectEventSource = () => {
      if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
        console.log("EventSource already exists and is not closed");
        return;
      }

      eventSource = new EventSource(
        `/api/submarine-swap?invoice=${exchangeOrder.invoice}&_=${Date.now()}`,
      );

      eventSource.onopen = () => {
        console.log("Connection opened");
      };

      eventSource.onmessage = (event) => {
        const msg: SubmarineSwapMessage = JSON.parse(event.data);

        console.log(msg);

        if (msg.status === "created") {
          setOrder(msg.data);
        }

        if (msg.status === "error") {
          setError(msg.message);
          eventSource?.close();
          return;
        }

        setStatus(msg.status);

        if (msg.status === "done") {
          eventSource?.close();
        }
      };

      eventSource.onerror = (error: Event) => {
        console.error("EventSource error:", error);
      };
    };

    connectEventSource();

    return () => {
      eventSource?.close();
    };
  }, [exchangeOrder]);

  return error ? (
    <Container>
      <Text variant="h2" weight="medium">
        An Error Occurred
      </Text>
      <Text className="text-center">{error}</Text>
    </Container>
  ) : (
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
                Successfully swapped{" "}
                <strong>{exchangeOrder?.amount} sats</strong> from Onchain
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
          <Text>Block confirmations can take a while. You can close this page while the swap continues in the background.</Text>
        </StatusBanner>
      ) : null}
    </Container>
  );
}
