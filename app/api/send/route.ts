import { NextResponse } from "next/server";
import fetchWithFF from "../utils";

export async function POST(req: Request) {
  const body = await req.json();

  if (
    typeof body.to !== "string" ||
    typeof body.amount !== "number" ||
    typeof body.address !== "string"
  ) {
    return NextResponse.json({
      error: "Invalid Input",
      data: null,
    });
  }

  const data = await fetchWithFF("create", {
    fromCcy: "BTCLN",
    toCcy: body.to,
    amount: body.amount + body.amount / 100,
    direction: "from",
    type: "fixed",
    toAddress: body.address,
  }).then((r) => r.json());

  if (data.code > 0 || !data.data.from.address) {
    return NextResponse.json({
      error: data.msg,
      data: null,
    });
  }

  return NextResponse.json({
    data: {
      invoice: data.data.from.address,
      token: data.data.token,
      id: data.data.id,
    },
  });
}
