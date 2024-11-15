"use server";

import { formatError } from "@/lib/errors";
import { fixedFloat } from "@/lib/ff";
import { CreateData, CreateRequest } from "@/lib/ff/types";
import { z } from "zod";

const createRequestSchema = z.object({
  type: z.string(),
  fromCcy: z.string(),
  toCcy: z.string(),
  direction: z.string(),
  amount: z.number(),
  toAddress: z.string(),
  tag: z.boolean().optional(),
  refcode: z.string().optional(),
  afftax: z.number().optional(),
});

export async function createOrder(
  args: CreateRequest,
): Promise<
  { success: true; data: CreateData } | { success: false; message: string }
> {
  try {
    const request = createRequestSchema.parse(args);
    const res = await fixedFloat.create(request);

    if (res.code > 0) {
      throw new Error("FixedFloat Error: " + res.msg);
    }

    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, message: formatError(e) };
  }
}
