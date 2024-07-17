"use server";

import { formatError } from "@/lib/errors";
import { fixedFloat } from "@/lib/ff";
import { SetEmailRequest } from "@/lib/ff/types";

export async function setOrderEmail(
  args: SetEmailRequest,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const res = await fixedFloat.setEmail(args);

    if (res.code > 0) {
      throw new Error(res.msg);
    }

    return { success: true };
  } catch (e) {
    return { success: false, message: formatError(e) };
  }
}
