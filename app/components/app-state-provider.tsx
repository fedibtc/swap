"use client";

import { Currency } from "@/lib/ff/types";
import { createContext, useContext, useState } from "react";

interface AppStateBase {
  currencies: Array<Currency>;
  screen: AppScreen;
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
}: {
  children: React.ReactNode;
  currencies: Array<Currency>;
}) {
  const [value, setValue] = useState<AppState>({
    direction: Direction.FromLightning,
    currencies,
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
        }) as AppState,
    );
  };

  return (
    <AppStateContext.Provider value={{ ...value, update }}>
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
