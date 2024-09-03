"use server";

import { formatError } from "@/lib/errors";
import { fixedFloat } from "@/lib/ff";
import { EmergencyRequest } from "@/lib/ff/types";

export async function handleEmergency(
  request: EmergencyRequest,
): Promise<
  { success: false; message: string } | { success: true; data: boolean }
> {
  try {
    const res = await fixedFloat.emergency(request);

    if (res.code > 0) {
      throw new Error("FixedFloat Error: " + res.msg);
    }

    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, message: formatError(e) };
  }
}
