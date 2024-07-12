import { NextResponse } from "next/server";
import fetchWithFF from "../utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({
      error: "Invalid Input",
      data: null,
    });
  }

  const prices = await fetchWithFF("price", {
    fromCcy: from,
    toCcy: to,
    amount: 1,
    direction: "from",
    type: "fixed",
  }).then((r) => r.json());

  if (!prices?.data) {
    return NextResponse.json({
      error: "Could not fetch rates from fixedfloat.",
      data: null,
    });
  }

  return NextResponse.json({
    data: {
      from: {
        code: prices.data.from.code,
        rate: Number(prices.data.from.rate),
        min: Number(prices.data.from.min),
        max: Number(prices.data.from.max),
      },
      to: {
        code: prices.data.to.code,
        rate: Number(prices.data.to.rate),
        min: Number(prices.data.to.min),
        max: Number(prices.data.to.max),
      },
    },
  });
}
