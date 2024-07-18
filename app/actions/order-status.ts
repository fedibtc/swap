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
    const res = await fixedFloat.order({
      id,
      token,
    });

    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, message: formatError(e) };
  }
}
