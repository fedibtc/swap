"use client";

import { Currency, OrderData } from "@/lib/ff/types";
import { createContext, useContext, useState } from "react";

interface OrderWithInfo extends OrderData {
  token: string;
}

export interface FixedFloatProviderValue {
  order: OrderWithInfo | null;
  setOrder: (order: OrderWithInfo | null) => void;
}

export const FixedFloatContext = createContext<FixedFloatProviderValue | null>(
  null,
);

export function FixedFloatProvider({
  children,
  currencies,
}: {
  children: React.ReactNode;
  currencies: Array<Currency> | null;
}) {
  const [order, setOrder] = useState<OrderWithInfo | null>(null);

  return (
    <FixedFloatContext.Provider
      value={
        currencies
          ? {
              order,
              setOrder,
            }
          : null
      }
    >
      {children}
    </FixedFloatContext.Provider>
  );
}

export function useFixedFloat() {
  return useContext(FixedFloatContext);
}
