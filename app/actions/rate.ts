"use server";

import { fixedFloat } from "@/lib/ff";

/**
 * Get the rate from lightning to `coin` with the given `amount`
 */
export async function getRateFromLightning(to: string, amount: number) {
  const pre = await getRateToLightning(to, amount);

  const price = await fixedFloat.price({
    fromCcy: "BTCLN",
    toCcy: to,
    amount: Number(pre.from.btc),
    direction: "from",
    type: "fixed",
    usd: true,
  });

  return price.data;
}

/**
 * Get the rate from `coin` to lightning with the given `amount`
 */
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

/**
 * Get the absolute rate from `from` to `to`
 */
export async function getAbsoluteRate(from: string, to: string) {
  return await fixedFloat.absoluteRate(from, to);
}
