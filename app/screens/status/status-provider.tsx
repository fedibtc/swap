import { OrderData } from "@/lib/ff/types";
import { createContext, useContext } from "react";

export type Order = Pick<
  OrderData,
  "email" | "status" | "from" | "to" | "emergency"
>;

export const StatusStateContext = createContext<{
  order: Order;
} | null>(null);

export function StatusStateProvider({
  children,
  order,
}: {
  children: React.ReactNode;
  order: Order;
}) {
  return (
    <StatusStateContext.Provider value={{ order }}>
      {children}
    </StatusStateContext.Provider>
  );
}

export function useOrderStatus() {
  const context = useContext(StatusStateContext);

  if (context === null) {
    throw new Error(
      "useOrderStatus() must be used within a StatusStateProvider",
    );
  }

  return context;
}
