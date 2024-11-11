"use client";

import { Currency } from "@/lib/ff/types";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { WebLNProvider } from "webln";

interface AppStateBase {
  screen: AppScreen;
  isFFBroken: boolean;
  draftAmount: number | null;
  draftAddress: string | null;
  draftEmail: string | null;
  boltzToLnRate: BoltzToLnRate | null;
  boltzFromLnRate: BoltzFromLnRate | null;
  webln: WebLNProvider | null;
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
  Address,
  Confirmation,
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
  const weblnRef = useRef<WebLNProvider | null>(null);
  const [value, setValue] = useState<Omit<AppState, "webln">>({
    direction: Direction.FromLightning,
    coin: "BTC",
    isFFBroken: currencies === null,
    boltzToLnRate,
    boltzFromLnRate,
    exchangeOrder: null,
    draftAmount: null,
    draftAddress: null,
    draftEmail: null,
    screen: AppScreen.Home,
  });

  const update = (state: Partial<AppState>) => {
    setValue(
      (v) =>
        ({
          ...v,
          ...state,
        } as AppState)
    );
  };

  useEffect(() => {
    async function initialize() {
      if (window.webln) {
        await window.webln.enable();

        if (
          typeof window.webln.isEnabled === "function" &&
          (await (window.webln as any).isEnabled())
        ) {
          weblnRef.current = window.webln;
        } else if (
          typeof window.webln.isEnabled === "boolean" &&
          window.webln.isEnabled
        ) {
          weblnRef.current = window.webln;
        }
      }
    }

    initialize();
  }, []);

  return (
    <AppStateContext.Provider
      value={
        {
          ...value,
          update,
          boltzToLnRate,
          boltzFromLnRate,
          webln: weblnRef.current,
        } as AppState & {
          update: (state: Partial<AppState>) => void;
        }
      }
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
