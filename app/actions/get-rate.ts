"use server";

import { fixedFloat } from "@/lib/ff";

export async function getRate(from: string, to: string) {
  const price = await fixedFloat.price({
    fromCcy: from,
    toCcy: to,
    amount: 1,
    direction: "from",
    type: "fixed",
  });

  return price.data;
}
