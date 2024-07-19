"use client";

import { Button, Text } from "@fedibtc/ui";
import Image from "next/image";
import { Direction, useAppState } from "@/app/components/app-state-provider";
import Flex from "@/app/components/ui/flex";
import { BorderContainer } from "../pending/pay-notice";
import { useOrderStatus } from "../status-provider";

export default function DoneStatus() {
  const { direction, coin } = useAppState();
  const { order } = useOrderStatus();

  const from =
    direction === Direction.FromLightning
      ? `${Math.round(Number(order.from.amount) * 100000000)} SATS`
      : `${Number(order.from.amount)} ${coin}`;
  const to =
    direction === Direction.ToLightning
      ? `${Math.round(Number(order.to.amount) * 100000000)} SATS`
      : `${Number(order.to.amount)} ${coin}`;

  return (
    <Flex grow col width="full">
      <Flex grow col gap={4}>
        <BorderContainer>
          <Image src="/logo.png" alt="Logo" width={64} height={64} />
          <Text variant="h2" weight="medium">
            Exchange Complete
          </Text>
          <Text className="text-center">
            Successfully exchanged <strong>{from}</strong> for{" "}
            <strong>{to}</strong>
          </Text>
        </BorderContainer>
      </Flex>
      <Button onClick={() => window.location.reload()}>Done</Button>
    </Flex>
  );
}
