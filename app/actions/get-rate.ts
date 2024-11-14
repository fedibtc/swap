"use server";

import { fixedFloat } from "@/lib/ff";

export async function getRateFromLightning(to: string, amount: number) {
  const pre = await getRateToLightning(to, amount);

  const price = await fixedFloat.price({
    fromCcy: "BTCLN",
    toCcy: to,
    amount: Number(pre.from.btc),
    direction: "from",
    type: "fixed",
    usd: true
  });

  return price.data;
}

export async function getRateToLightning(from: string, amount: number) {
  const price = await fixedFloat.price({
    fromCcy: from,
    toCcy: "BTCLN",
    amount,
    direction: "to",
    type: "fixed",
  });

  return price.data;
}
