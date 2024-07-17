"use client";

import { Button, Text } from "@fedibtc/ui";
import Container from "../components/container";
import Flex from "../components/flex";
import SwapIndicator from "../components/swap-indicator";

export default function Complete() {
  return (
    <Container>
      <Flex col gap={4} width="full" align="center" p={4}>
        <Text variant="h2" weight="medium">
          Swap Complete
        </Text>
        <SwapIndicator />
        <Button onClick={() => window.location.reload()}>Restart</Button>
      </Flex>
    </Container>
  );
}
