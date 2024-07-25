"use client";

import {
  AppStateBoltzFromLn,
  useAppState,
} from "@/app/components/app-state-provider";
import Container from "@/app/components/container";
import SwapIndicator from "@/app/components/swap-indicator";
import { useEffect, useRef, useState } from "react";
import Flex from "@/app/components/ui/flex";
import { ProgressStep } from "../status/pending/step";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Button, Icon, Text, useFediInjection } from "@fedibtc/ui";
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
  const eventSourceRef = useRef<EventSource | null>(null);
  const { exchangeOrder } = useAppState<AppStateBoltzFromLn>();
  const { webln } = useFediInjection();

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

    let ev: EventSource;

    if (!eventSourceRef.current) {
      eventSourceRef.current = new EventSource(
        `/api/reverse-swap?amount=${exchangeOrder.amount}&address=${exchangeOrder.address}`,
      );
    }

    ev = eventSourceRef.current;

    ev.onmessage = (event) => {
      const msg: ReverseSwapMessage = JSON.parse(event.data);

      if (msg.status === "created") {
        setOrder(msg.data);
      }

      setStatus(msg.status);

      if (msg.status === "done") {
        ev.close();
      }
    };

    ev.onerror = (error) => {
      console.error("EventSource error:", error);
      if (status === "new") {
        setError("Failed to create swap");
      } else if (status === "created") {
        setError("Payment expired");
      } else {
        setError("An unknown error occurred");
      }
      ev.close();
    };
  }, [exchangeOrder, status]);

  useEffect(() => {
    if (!order) return;

    webln.sendPayment(order.invoice).catch(() => {});
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
