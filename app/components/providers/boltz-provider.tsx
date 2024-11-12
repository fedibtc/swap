"use client";

import { createContext, useContext, useState } from "react";
import { Direction } from "./app-state-provider";

export interface BoltzSwapFromLn {
  direction: typeof Direction.FromLightning;
  address: string;
  amount: number;
}

export interface BoltzSwapToLn {
  direction: typeof Direction.ToLightning;
  invoice: string;
  amount: number;
}

export interface BoltzProviderValue {
  boltzToLnRate: BoltzToLnRate;
  boltzFromLnRate: BoltzFromLnRate;
  swap: BoltzSwapFromLn | BoltzSwapToLn | null;
  setSwap: (swap: BoltzSwapFromLn | BoltzSwapToLn | null) => void;
}

export const BoltzContext = createContext<BoltzProviderValue | null>(null);

export function BoltzProvider({
  children,
  boltzToLnRate,
  boltzFromLnRate,
}: {
  children: React.ReactNode;
  boltzToLnRate: BoltzToLnRate | null;
  boltzFromLnRate: BoltzFromLnRate | null;
}) {
  const [swap, setSwap] = useState<BoltzSwapFromLn | BoltzSwapToLn | null>(
    null
  );

  return (
    <BoltzContext.Provider
      value={
        boltzToLnRate && boltzFromLnRate
          ? {
              boltzToLnRate,
              boltzFromLnRate,
              swap,
              setSwap,
            }
          : null
      }
    >
      {children}
    </BoltzContext.Provider>
  );
}

export function useBoltz() {
  return useContext(BoltzContext);
}

export interface BoltzToLnRate {
  hash: string;
  rate: number;
  limits: {
    maximal: number;
    minimal: number;
    maximalZeroConf: number;
  };
  fees: {
    percentage: number;
    minerFees: number;
  };
}

export interface BoltzFromLnRate {
  hash: string;
  rate: number;
  limits: {
    maximal: number;
    minimal: number;
  };
  fees: {
    percentage: number;
    minerFees: {
      claim: number;
      lockup: number;
    };
  };
}
