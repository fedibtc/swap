"use client";

import {
  Direction,
  useAppState,
} from "@/app/components/providers/app-state-provider";
import { useCallback, useEffect, useState } from "react";
import { getOrder } from "@/app/actions/order-status";
import { formatError } from "@/lib/errors";
import Container from "@/app/components/container";
import { Icon, Text } from "@fedibtc/ui";
import { OrderStatus } from "@/lib/ff/types";
import ExpiredStatus from "./expired";
import EmergencyStatusComponent from "./emergency";
import PendingStatus from "./pending";
import DoneStatus from "./done";
import SwapIndicator from "@/app/components/swap-indicator";
import { useFixedFloat } from "@/app/components/providers/ff-provider";

export default function Status() {
  const { direction, webln } = useAppState();
  const ff = useFixedFloat();

  const [error, setError] = useState<string>();

  if (!ff || !ff.order) throw new Error("Invalid FixedFloat state");

  const { order, setOrder } = ff;

  const pollOrder = useCallback(async () => {
    try {
      const res = await getOrder(order.id, order.token);

      if (!res.success) {
        throw new Error(res.message);
      }

      setOrder({
        ...order,
        ...res.data,
      });
    } catch (e) {
      setError(formatError(e));
    }
  }, [order, setOrder]);

  useEffect(() => {
    const interval = setInterval(pollOrder, 5000);

    return () => clearInterval(interval);
  }, [pollOrder]);

  useEffect(() => {
    if (
      order &&
      direction === Direction.FromLightning &&
      order.status === OrderStatus.NEW &&
      webln
    ) {
      webln.sendPayment(order.from.address).catch(() => {});
    }
  }, [direction, order, webln]);

  return order ? (
    <Container className="p-4">
      <SwapIndicator />
      {order.status === OrderStatus.EXPIRED ? (
        <ExpiredStatus />
      ) : order.status === OrderStatus.EMERGENCY ? (
        <EmergencyStatusComponent />
      ) : order.status === OrderStatus.DONE ? (
        <DoneStatus />
      ) : (
        <PendingStatus />
      )}
    </Container>
  ) : error ? (
    <Container>
      <Text variant="h2" weight="medium">
        An Error Occurred
      </Text>
      <Text className="text-center">{error}</Text>
    </Container>
  ) : (
    <Container>
      <Icon
        icon="IconLoader2"
        size="lg"
        className="animate-spin text-lightGrey"
      />
      <Text>Loading Order...</Text>
    </Container>
  );
}
