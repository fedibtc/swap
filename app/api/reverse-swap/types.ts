import { ReverseSwapResponse } from "@/lib/types";

export type ReverseSwapMessage = {
  status: "created",
  data: ReverseSwapResponse
} | {
  status: "pending"
} | {
  status: "error",
  message: string
} | {
  status: "done"
};
