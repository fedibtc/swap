"use client";

import { Currency, PriceData } from "@/lib/ff/types";
import { createContext, useContext, useEffect, useState } from "react";
import { getRate } from "../actions/get-rate";

interface AppState {
  direction: Direction;
  currencies: Array<Currency>;
  rate: PriceData;
  isRateLoading: boolean;
  coin: string;
  exchangeOrder: ExchangeData | null;
  screen: AppScreen;
}

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
  rate,
}: {
  children: React.ReactNode;
  currencies: Array<Currency>;
  rate: PriceData;
}) {
  const [value, setValue] = useState<AppState>({
    direction: Direction.FromLightning,
    currencies,
    rate,
    coin: "BTC",
    isRateLoading: false,
    exchangeOrder: null,
    screen: AppScreen.Home,
  });

  const update = (state: Partial<AppState>) => {
    setValue((v) => ({
      ...v,
      ...state,
    }));
  };

  useEffect(() => {
    async function updateRate() {
      update({ isRateLoading: true });
      const rate =
        value.direction === Direction.FromLightning
          ? await getRate("BTCLN", value.coin)
          : await getRate(value.coin, "BTCLN");

      update({ rate });
      update({ isRateLoading: false });
    }

    updateRate();
  }, [value.direction, value.coin]);

  return (
    <AppStateContext.Provider value={{ ...value, update }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (context === null) {
    throw new Error("useAppState() must be used within an AppStateProvider");
  }

  return context;
}
