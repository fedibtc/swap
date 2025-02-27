"use server";

import { formatError } from "@/lib/errors";
import { fixedFloat } from "@/lib/ff";
import { OrderData } from "@/lib/ff/types";

export async function getOrder(
  id: string,
  token: string,
): Promise<
  { success: false; message: string } | { success: true; data: OrderData }
> {
  try {
    if (typeof id !== "string") throw new Error("Invalid id");
    if (typeof token !== "string") throw new Error("Invalid token");

    const res = await fixedFloat.order({
      id,
      token,
    });

    if (res.code > 0) {
      throw new Error(
        "There was an error with the exchange provider: " + res.msg,
      );
    }

    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, message: formatError(e) };
  }
}
