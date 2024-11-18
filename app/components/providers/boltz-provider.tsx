"use client";

import { createContext, useContext, useState } from "react";
import { Direction } from "./app-state-provider";
import {
  ReverseSwapRate,
  ReverseSwapResponse,
  SubmarineSwapRate,
  SubmarineSwapResponse,
} from "@/lib/boltz/types";
import { ECPairInterface } from "ecpair";

/**
 * Swap information for a boltz Reverse Swap
 */
export interface BoltzSwapFromLn {
  direction: typeof Direction.FromLightning;
  swap: ReverseSwapResponse;
  keypair: ECPairInterface;
  preimage: Buffer;
}

/**
 * Swap information for a boltz Submarine Swap
 */
export interface BoltzSwapToLn {
  direction: typeof Direction.ToLightning;
  swap: SubmarineSwapResponse;
  keypair: ECPairInterface;
}

export interface BoltzProviderValue {
  boltzToLnRate: SubmarineSwapRate;
  boltzFromLnRate: ReverseSwapRate;
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
  boltzToLnRate: SubmarineSwapRate | null;
  boltzFromLnRate: ReverseSwapRate | null;
}) {
  const [swap, setSwap] = useState<BoltzSwapFromLn | BoltzSwapToLn | null>(
    null,
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
