"use client";

import { Direction, useAppState } from "@/app/components/app-state-provider";
import Switcher from "@/app/components/switcher";
import FromLN from "./from-ln";
import ToLN from "./to-ln";
import Container from "@/app/components/container";

export default function Home() {
  const { direction } = useAppState();

  return (
    <Container className="justify-start items-stretch w-full p-4">
      <Switcher />
      {direction === Direction.FromLightning ? <FromLN /> : <ToLN />}
    </Container>
  );
}
