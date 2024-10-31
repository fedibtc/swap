"use client";

import { Currency } from "@/lib/ff/types";
import { createContext, useContext, useState } from "react";

interface AppStateBase {
  screen: AppScreen;
  isFFBroken: boolean;
  boltzToLnRate: BoltzToLnRate | null;
  boltzFromLnRate: BoltzFromLnRate | null;
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

export interface AppStateBoltzToLn extends AppStateBase {
  direction: Direction.ToLightning;
  coin: "BTC";
  exchangeOrder: {
    invoice: string;
    amount: number;
  } | null;
}

export interface AppStateBoltzFromLn extends AppStateBase {
  direction: Direction.FromLightning;
  coin: "BTC";
  exchangeOrder: {
    address: string;
    amount: number;
  } | null;
}

export interface AppStateFF extends AppStateBase {
  direction: Direction;
  coin: string;
  exchangeOrder: ExchangeData | null;
}

type AppState = AppStateFF | AppStateBoltzToLn | AppStateBoltzFromLn;

interface ExchangeData {
  id: string;
  token: string;
}

export enum Direction {
  FromLightning,
  ToLightning,
}

export enum AppScreen {
  Home,
  Status,
  ToLnStatus,
  FromLnStatus,
}

export const AppStateContext = createContext<
  | (AppState & {
      update: (state: Partial<AppState>) => void;
    })
  | null
>(null);

export function AppStateProvider({
  children,
  currencies,
  boltzToLnRate,
  boltzFromLnRate,
}: {
  children: React.ReactNode;
  currencies: Array<Currency> | null;
    boltzToLnRate: BoltzToLnRate | null;
    boltzFromLnRate: BoltzFromLnRate | null;
}) {
  const [value, setValue] = useState<AppState>({
    direction: Direction.FromLightning,
    coin: "BTC",
    exchangeOrder: null,
    screen: AppScreen.Home,
  } as AppState);

  const update = (state: Partial<AppState>) => {
    setValue(
      (v) =>
        ({
          ...v,
          ...state,
        } as AppState)
    );
  };

  return (
    <AppStateContext.Provider
      value={{ ...value, update, isFFBroken: currencies === null, boltzToLnRate, boltzFromLnRate }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState<T extends AppState = AppState>() {
  const context = useContext(AppStateContext);

  if (context === null) {
    throw new Error("useAppState() must be used within an AppStateProvider");
  }

  return context as unknown as T & { update: (state: Partial<T>) => void };
}
