"use client";

import { getOrderStatus } from "@/app/actions/order-status";
import { AppScreen, useAppState } from "@/app/components/app-state-provider";
import Flex from "@/app/components/flex";
import SwapIndicator from "@/app/components/swap-indicator";
import Container from "@/components/container";
import { OrderStatus } from "@/lib/ff/types";
import { Icon, Text } from "@fedibtc/ui";
import { useEffect, useState } from "react";
import { styled } from "react-tailwind-variants";

const statusSteps = [
  OrderStatus.PENDING,
  OrderStatus.EXCHANGE,
  OrderStatus.DONE,
];

export default function Status() {
  const { orderStatus, exchangeOrder, update } = useAppState();

  const [isEmergency, setIsEmergency] = useState(false);

  // Check status every second
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!exchangeOrder || isEmergency) return;

      const status = await getOrderStatus(
        exchangeOrder.id,
        exchangeOrder.token,
      );

      if (status.success) {
        if (status.data === OrderStatus.EMERGENCY) {
          setIsEmergency(true);
          alert("EMERGENCY YO");
          clearInterval(interval);
        } else if (status.data === OrderStatus.DONE) {
          update({ orderStatus: status.data, screen: AppScreen.Complete });
        } else {
          update({ orderStatus: status.data });
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [exchangeOrder, update, isEmergency]);

  const determineStepStatus = (step: OrderStatus) => {
    if (orderStatus === step || !orderStatus) {
      return "loading";
    } else if (statusSteps.indexOf(orderStatus) > statusSteps.indexOf(step)) {
      return "success";
    } else {
      return "idle";
    }
  };

  return (
    <Container>
      <Flex col grow width="full" gap={2} p={4}>
        <Flex col grow gap={4}>
          <SwapIndicator />

          <Flex row align="center" gap={1}>
            <StatusProgressStep
              status={determineStepStatus(OrderStatus.PENDING)}
              text="Processing"
            />
            <StatusProgressStep
              status={determineStepStatus(OrderStatus.EXCHANGE)}
              text="Exchanging"
            />
            <StatusProgressStep
              status={determineStepStatus(OrderStatus.DONE)}
              text="Confirmation"
            />
          </Flex>
        </Flex>
        <StatusBanner>
          <Icon icon="IconInfoTriangle" className="w-6 h-6" />
          <Text>Warning: Do not close this page</Text>
        </StatusBanner>
      </Flex>
    </Container>
  );
}

function StatusProgressStep({
  status,
  text,
}: {
  status: "idle" | "loading" | "success";
  text: string;
}) {
  return (
    <Flex grow col align="center" noBasis>
      <StatusStep status={status} />
      <Flex gap={1} align="center">
        {status === "idle" ? (
          <Icon icon="IconMinus" className="w-4 h-4 text-grey" />
        ) : status === "loading" ? (
          <Icon icon="IconLoader2" className="w-4 h-4 animate-spin text-grey" />
        ) : (
          <Icon icon="IconCheck" className="w-4 h-4 text-green" />
        )}
        <Text variant="small">{text}</Text>
      </Flex>
    </Flex>
  );
}

const StatusBanner = styled("div", {
  base: "flex gap-2 items-center p-4 rounded-lg border-2 border-yellow-400 bg-yellow-100 text-yellow-600",
});

const StatusStep = styled("div", {
  base: "grow h-2 w-full rounded-full",
  variants: {
    status: {
      idle: "bg-lightGrey",
      loading: "animate-pulse bg-blue-300",
      success: "bg-blue-500",
    },
  },
});
