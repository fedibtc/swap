"use client";

import { Currency } from "@/lib/ff/types";
import { createContext, useContext, useState } from "react";

interface ExchangeData {
  id: string;
  token: string;
}

export interface FixedFloatProviderValue {
  swap: ExchangeData | null;
  setSwap: (swap: ExchangeData | null) => void;
}

export const FixedFloatContext = createContext<FixedFloatProviderValue | null>(
  null
);

export function FixedFloatProvider({
  children,
  currencies,
}: {
  children: React.ReactNode;
  currencies: Array<Currency> | null;
}) {
  const [swap, setSwap] = useState<ExchangeData | null>(null);

  return (
    <FixedFloatContext.Provider
      value={
        currencies
          ? {
            swap,
            setSwap,
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
