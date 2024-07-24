"use client";

import {
  AppStateBoltzFromLn,
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
import { ReverseSwapResponse } from "@/lib/types";
import { ReverseSwapMessage } from "@/app/api/reverse-swap/types";
import Image from "next/image";

const statusSteps = ["new", "created", "pending", "done"];

type Status = (typeof statusSteps)[number];

export default function FromLnStatus() {
  const [status, setStatus] = useState<Status>("new");
  const [order, setOrder] = useState<ReverseSwapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { exchangeOrder } = useAppState<AppStateBoltzFromLn>();

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

    const eventSource = new EventSource(
      `/api/reverse-swap?amount=${exchangeOrder.amount}&address=${exchangeOrder.address}`,
    );

    eventSource.onopen = () => {
      console.log("Connection opened");
    };

    eventSource.onmessage = (event) => {
      const msg: ReverseSwapMessage = JSON.parse(event.data);

      console.log(msg);

      if (msg.status === "created") {
        setOrder(msg.data);
      }

      if (msg.status === "error") {
        setError(msg.message);
        eventSource.close();
        return;
      }

      setStatus(msg.status);

      if (msg.status === "done") {
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
    };

    return () => {
      eventSource.close();
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
