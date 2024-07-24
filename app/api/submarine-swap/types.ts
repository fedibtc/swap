import { SubmarineSwapResponse } from "@/lib/types";

export type SubmarineSwapMessage = {
  status: "created",
  data: SubmarineSwapResponse
} | {
  status: "pending"
} | {
  status: "error",
  message: string
} | {
  status: "done"
};
