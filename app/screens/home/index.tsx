"use client";

import Switcher from "@/app/components/switcher";
import Container from "@/components/container";
import { Text } from "@fedibtc/ui";

export default function Home() {
  return <Container className="items-start p-2">
    <Switcher />
    <Text>Home</Text>
  </Container>;
}
