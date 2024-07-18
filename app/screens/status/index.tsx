"use client";

import { getOrderStatus } from "@/app/actions/order-status";
import {
  AppScreen,
  Direction,
  useAppState,
} from "@/app/components/app-state-provider";
import Flex from "@/app/components/flex";
import SwapIndicator from "@/app/components/swap-indicator";
import { OrderStatus } from "@/lib/ff/types";
import { Icon, Text, useFediInjection } from "@fedibtc/ui";
import { useEffect, useState } from "react";
import { styled } from "react-tailwind-variants";
import { PayNotice } from "./pay-notice";
import { PaidNotice } from "./paid-notice";
import { StatusProgressStep } from "./status-step";
import Container from "@/app/components/container";

const statusSteps = [
  OrderStatus.NEW,
  OrderStatus.PENDING,
  OrderStatus.EXCHANGE,
  OrderStatus.DONE,
];

export default function Status() {
  const { orderStatus, exchangeOrder, update, direction } = useAppState();
  const { webln } = useFediInjection();

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

  useEffect(() => {
    if (exchangeOrder?.payAddress && direction === Direction.FromLightning) {
      webln.sendPayment(exchangeOrder.payAddress).catch(() => {});
    }
  }, [exchangeOrder?.payAddress, webln, direction]);

  return (
    <Container>
      <Flex col grow width="full" gap={2} p={4}>
        <Flex col grow gap={4}>
          <SwapIndicator />

          <Flex row align="center" gap={1}>
            <StatusProgressStep
              status={determineStepStatus(OrderStatus.NEW)}
              text="Deposit"
            />
            <StatusProgressStep
              status={determineStepStatus(OrderStatus.PENDING)}
              text="Confirmation"
            />
            <StatusProgressStep
              status={determineStepStatus(OrderStatus.EXCHANGE)}
              text="Exchange"
            />
            <StatusProgressStep
              status={determineStepStatus(OrderStatus.DONE)}
              text="Done"
            />
          </Flex>
          {orderStatus === OrderStatus.NEW ? <PayNotice /> : <PaidNotice />}
        </Flex>
        <StatusBanner>
          <Icon icon="IconInfoTriangle" className="w-6 h-6" />
          <Text>Warning: Do not close this page</Text>
        </StatusBanner>
      </Flex>
    </Container>
  );
}

const StatusBanner = styled("div", {
  base: "flex gap-2 items-center p-4 rounded-lg border-2 border-yellow-400 bg-yellow-100 text-yellow-600",
});
