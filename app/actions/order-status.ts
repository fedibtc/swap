"use server";

import { formatError } from "@/lib/errors";
import { fixedFloat } from "@/lib/ff";
import { OrderStatus } from "@/lib/ff/types";

export async function getOrderStatus(
  id: string,
  token: string,
): Promise<
  { success: false; message: string } | { success: true; data: OrderStatus }
> {
  try {
    const res = await fixedFloat.order({
      id,
      token,
    });

    return { success: true, data: res.data.status };
  } catch (e) {
    return { success: false, message: formatError(e) };
  }
}
