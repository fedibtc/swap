"use client";

import {
  AppStateFF,
  Direction,
  useAppState,
} from "@/app/components/app-state-provider";
import { useCallback, useEffect, useState } from "react";
import { Order, StatusStateProvider } from "./status-provider";
import { getOrder } from "@/app/actions/order-status";
import { formatError } from "@/lib/errors";
import Container from "@/app/components/container";
import { Icon, Text, useFediInjection } from "@fedibtc/ui";
import SwapIndicator from "@/app/components/swap-indicator";
import { OrderStatus } from "@/lib/ff/types";
import ExpiredStatus from "./expired";
import EmergencyStatusComponent from "./emergency";
import PendingStatus from "./pending";
import DoneStatus from "./done";

export default function Status() {
  const { exchangeOrder, direction } = useAppState<AppStateFF>();
  const { webln } = useFediInjection();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string>();

  const pollOrder = useCallback(async () => {
    if (!exchangeOrder || !order) return;

    const res = await getOrder(exchangeOrder.id, exchangeOrder.token);

    if (res.success) {
      setOrder({
        email: res.data.email,
        status: res.data.status,
        from: res.data.from,
        to: res.data.to,
        emergency: res.data.emergency,
      });
    }
  }, [exchangeOrder, order]);

  useEffect(() => {
    async function retrieveOrder() {
      if (!exchangeOrder) return;

      try {
        const res = await getOrder(exchangeOrder.id, exchangeOrder.token);

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
  }, [exchangeOrder, setOrder]);

  useEffect(() => {
    const interval = setInterval(pollOrder, 5000);

    return () => clearInterval(interval);
  }, [pollOrder]);

  useEffect(() => {
    if (
      order &&
      direction === Direction.FromLightning &&
      order.status === OrderStatus.NEW
    ) {
      webln.sendPayment(order.from.address).catch(() => {});
    }
  }, [direction, order, webln]);

  return order ? (
    <StatusStateProvider order={order}>
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
