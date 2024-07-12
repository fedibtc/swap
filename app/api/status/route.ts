import { NextResponse } from "next/server";
import fetchWithFF from "../utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  if (!id || !token) {
    return NextResponse.json({
      error: "Invalid Input",
      data: null,
    });
  }

  const order = await fetchWithFF("order", {
    id,
    token,
  }).then((r) => r.json());

  if (!order?.data) {
    return NextResponse.json({
      error: "Could not fetch order",
      data: null,
    });
  }

  return NextResponse.json({
    data: {
      status: order.data.status,
    },
  });
}
