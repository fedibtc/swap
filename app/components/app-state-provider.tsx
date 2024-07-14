"use client";

import { CreateData, Currency } from "@/lib/ff/types";
import { createContext, useContext, useState } from "react";

interface AppState {
  direction: Direction;
  currencies: Array<Currency>;
  altcoin: string;
  exchangeOrder: CreateData | null;
  screen: AppScreen;
}

export enum Direction {
  FromLighting,
  ToLighting,
}

export enum AppScreen {
  Home,
  Pending,
  Complete,
}

export const AppStateContext = createContext<
  | (AppState & {
      update: (state: Partial<AppState>) => void;
    })
  | null
>(null);

export function AppStateProvider({ children, currencies }: { children: React.ReactNode, currencies: Array<Currency> }) {
  const [value, setValue] = useState<AppState>({
    direction: Direction.ToLighting,
    currencies,
    altcoin: "USDCETH",
    exchangeOrder: null,
    screen: AppScreen.Home,
  });

  const update = (state: Partial<AppState>) => {
    setValue((v) => ({
      ...v,
      ...state,
    }));
  };

  return (
    <AppStateContext.Provider value={{ ...value, update }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext)

  if(context === null) {
    throw new Error("useAppState() must be used within an AppStateProvider")
  }

  return context
}
