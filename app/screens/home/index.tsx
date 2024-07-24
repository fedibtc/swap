"use client";

import { Direction, useAppState } from "@/app/components/app-state-provider";
import Switcher from "@/app/components/switcher";
import FromLN from "./from-ln";
import ToLN from "./to-ln";
import Container from "@/app/components/container";
import { useEffect, useMemo, useState } from "react";
import { getRate } from "@/app/actions/get-rate";
import { PriceData } from "@/lib/ff/types";
import LnToBtc from "./ln-to-btc";
import BtcToLn from "./btc-to-ln";

export default function Home() {
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [rate, setRate] = useState<PriceData | null>(null);
  const { direction, coin, update } = useAppState();

  useEffect(() => {
    async function updateRate() {
      setIsRateLoading(true);
      const rate =
        direction === Direction.FromLightning
          ? await getRate("BTCLN", coin)
          : await getRate(coin, "BTCLN");

      setRate(rate);
      setIsRateLoading(false);
    }

    if (coin !== "BTC") updateRate();
  }, [direction, coin, update]);

  let content = useMemo(() => {
    if (direction === Direction.FromLightning) {
      if (coin === "BTC") {
        return <LnToBtc />;
      } else {
        return <FromLN isRateLoading={isRateLoading} rate={rate} />;
      }
    } else {
      if (coin === "BTC") {
        return <BtcToLn />;
      } else {
        return <ToLN isRateLoading={isRateLoading} rate={rate} />;
      }
    }
  }, [direction, coin, isRateLoading, rate]);

  return (
    <Container className="justify-start items-stretch w-full p-4">
      <Switcher />
      {content}
    </Container>
  );
}
