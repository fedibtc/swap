"use server";

import { formatError } from "@/lib/errors";
import { fixedFloat } from "@/lib/ff";
import { SetEmailRequest } from "@/lib/ff/types";
import { z } from "zod";

const inputSchema = z.object({
  id: z.string(),
  token: z.string(),
  email: z.string(),
});

/**
 * Set the email address for a FixedFloat order
 */
export async function setOrderEmail(
  args: z.infer<typeof inputSchema>,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const input = inputSchema.parse(args);

    const res = await fixedFloat.setEmail(input);

    if (res.code > 0) {
      throw new Error("FixedFloat Error: " + res.msg);
    }

    return { success: true };
  } catch (e) {
    return { success: false, message: formatError(e) };
  }
}
