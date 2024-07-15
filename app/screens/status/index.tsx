"use client";

import Flex from "@/app/components/flex";
import SwapIndicator from "@/app/components/swap-indicator";
import Container from "@/components/container";
import { Button, Icon, Text } from "@fedibtc/ui";
import { styled } from "react-tailwind-variants";

export default function Status() {
  return (
    <Container>
      <Flex col grow width="full" gap={2} p={4}>
        <StatusBanner>
          <Icon icon="IconInfoTriangle" className="w-6 h-6" />
          <Text>Warning: Do not close this page</Text>
        </StatusBanner>
        <Flex col gap={2} grow justify="center">
          <SwapIndicator />
        </Flex>
      </Flex>
    </Container>
  );
}

const StatusBanner = styled("div", {
  base: "flex gap-2 items-center p-4 rounded-lg border-2 border-yellow-400 bg-yellow-100 text-yellow-600",
});
