"use server";

import { formatError } from "@/lib/errors";
import { fixedFloat } from "@/lib/ff";
import { EmergencyRequest } from "@/lib/ff/types";
import { z } from "zod";

const emergencyRefundSchema = z.object({
  id: z.string(),
  token: z.string(),
  choice: z.literal("REFUND"),
  address: z.string(),
  tag: z.string().optional(),
});

const emergencyExchangeSchema = z.object({
  id: z.string(),
  token: z.string(),
  choice: z.literal("EXCHANGE"),
  tag: z.string().optional(),
});

const inputSchema = z.union([emergencyRefundSchema, emergencyExchangeSchema]);

export async function handleEmergency(
  request: z.infer<typeof inputSchema>,
): Promise<
  { success: false; message: string } | { success: true; data: boolean }
> {
  try {
    const input = inputSchema.parse(request);

    const res = await fixedFloat.emergency(input);

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
