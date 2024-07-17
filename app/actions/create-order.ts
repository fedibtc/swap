"use server";

import { formatError } from "@/lib/errors";
import { fixedFloat } from "@/lib/ff";
import { CreateData, CreateRequest } from "@/lib/ff/types";

export async function createOrder(
  args: CreateRequest,
): Promise<
  { success: true; data: CreateData } | { success: false; message: string }
> {
  try {
    const res = await fixedFloat.create(args);

    console.log(res);

    if (res.code > 0) {
      throw new Error(res.msg);
    }

    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, message: formatError(e) };
  }
}
