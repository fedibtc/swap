"use client";

import {
  Direction,
  useAppState,
} from "@/app/components/providers/app-state-provider";
import { useCallback, useEffect, useState } from "react";
import { Order, StatusStateProvider } from "./status-provider";
import { getOrder } from "@/app/actions/order-status";
import { formatError } from "@/lib/errors";
import Container from "@/app/components/container";
import { Icon, Text } from "@fedibtc/ui";
import { OrderStatus } from "@/lib/ff/types";
import ExpiredStatus from "./expired";
import EmergencyStatusComponent from "./emergency";
import PendingStatus from "./pending";
import DoneStatus from "./done";
import CoinHeader from "@/app/components/coin-header";
import { useFixedFloat } from "@/app/components/providers/ff-provider";

export default function Status() {
  const { direction, webln } = useAppState();
  const ff = useFixedFloat();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string>();

  if (!ff || !ff.swap) throw new Error("Invalid FixedFloat state");

  const swap = ff.swap;

  const pollOrder = useCallback(async () => {
    if (!swap || !order) return;

    const res = await getOrder(swap.id, swap.token);

    if (res.success) {
      setOrder({
        email: res.data.email,
        status: res.data.status,
        from: res.data.from,
        to: res.data.to,
        emergency: res.data.emergency,
      });
    }
  }, [swap, order]);

  useEffect(() => {
    async function retrieveOrder() {
      if (!swap) return;

      try {
        const res = await getOrder(swap.id, swap.token);

        if (!res.success) {
          throw new Error(res.message);
        }

        setOrder({
          email: res.data.email,
          status: res.data.status,
          from: res.data.from,
          to: res.data.to,
          emergency: res.data.emergency,
        });
      } catch (e) {
        setError(formatError(e));
      }
    }

    retrieveOrder();
  }, [swap, setOrder]);

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
    <StatusStateProvider order={order}>
      <Container className="p-4">
        <CoinHeader />
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
    </StatusStateProvider>
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
