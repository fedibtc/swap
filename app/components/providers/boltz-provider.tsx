"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Direction } from "./app-state-provider";
import {
  ReverseSwapRate,
  ReverseSwapResponse,
  SubmarineSwapRate,
  SubmarineSwapResponse,
} from "@/lib/boltz/types";
import { ECPairInterface } from "ecpair";
import { boltz } from "@/lib/boltz";

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
  refetchRates: () => Promise<{
    boltzToLnRate: SubmarineSwapRate;
    boltzFromLnRate: ReverseSwapRate;
  }>;
}

export const BoltzContext = createContext<BoltzProviderValue | null>(null);

export function BoltzProvider({
  children,
  initialBoltzToLnRate,
  initialBoltzFromLnRate,
}: {
  children: React.ReactNode;
  initialBoltzToLnRate: SubmarineSwapRate | null;
  initialBoltzFromLnRate: ReverseSwapRate | null;
}) {
  const [boltzToLnRate, setBoltzToLnRate] = useState<SubmarineSwapRate | null>(
    initialBoltzToLnRate,
  );
  const [boltzFromLnRate, setBoltzFromLnRate] =
    useState<ReverseSwapRate | null>(initialBoltzFromLnRate);
  const [swap, setSwap] = useState<BoltzSwapFromLn | BoltzSwapToLn | null>(
    null,
  );

  const refetchRates = useCallback(async () => {
    const fromLnRate = await boltz.reverseSwapRate();
    const toLnRate = await boltz.submarineSwapRate();

    setBoltzToLnRate(toLnRate.BTC.BTC);
    setBoltzFromLnRate(fromLnRate.BTC.BTC);

    return {
      boltzToLnRate: toLnRate.BTC.BTC,
      boltzFromLnRate: fromLnRate.BTC.BTC,
    };
  }, []);

  return (
    <BoltzContext.Provider
      value={
        boltzToLnRate && boltzFromLnRate
          ? {
              boltzToLnRate,
              boltzFromLnRate,
              swap,
              setSwap,
              refetchRates,
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
