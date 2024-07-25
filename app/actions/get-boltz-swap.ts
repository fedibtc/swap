"use server";

import { formatError } from "@/lib/errors";

export async function getBoltzSwap(id: string): Promise<
  | { success: false; message: string }
  | {
      success: true;
      data: {
        status: string;
        zeroConfRejected: boolean;
        transaction: {
          id: string;
          hex: string;
        };
      };
    }
> {
  try {
    const res = await fetch(`https://api.boltz.exchange/v2/swap/${id}`);

    return {
      success: true,
      data: await res.json(),
    };
  } catch (e) {
    return {
      success: false,
      message: formatError(e),
    };
  }
}
