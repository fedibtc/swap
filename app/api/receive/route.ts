import { tokens } from "@/lib/constants";
import { NextResponse } from "next/server";
import fetchWithFF from "../utils";

export async function POST(req: Request) {
  const body = await req.json();

  console.log(body);

  if (
    typeof body.from !== "string" ||
    typeof body.amount !== "number" ||
    typeof body.address !== "string"
  ) {
    return NextResponse.json({
      error: "Invalid Input",
      data: null,
    });
  }

  const data = await fetchWithFF("create", {
    fromCcy: body.from,
    toCcy: "BTCLN",
    amount: +body.amount.toFixed(8),
    direction: "to",
    type: "fixed",
    toAddress: body.address,
  }).then((r) => r.json());

  const addr = data.data.from.address;
  const contractAddr = tokens.find((x) => x.code === body.from);
  const amount = Number(data.data.from.amount);

  if (addr && contractAddr && amount) {
    const invoice = `${contractAddr.network}:${
      contractAddr.contract_address
    }/transfer?address=${addr}&uint256=${amount * 10 ** 6}`;

    return NextResponse.json({
      data: {
        invoice,
        contractAddress: contractAddr,
        recipientAddress: addr,
        amount,
        token: data.data.token,
        id: data.data.id,
      },
    });
  } else {
    return NextResponse.json({
      error: "Invalid Input",
      data: null,
    });
  }
}
