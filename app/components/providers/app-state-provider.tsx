"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { WebLNProvider } from "webln";
import { useBoltz } from "./boltz-provider";

interface AppState {
  /** Current screen */
  screen: AppScreen;
  /** Amount (in SATS) to be exchanged */
  draftAmount: number | null;
  /** Address / Invoice to receive the funds */
  draftAddress: string | null;
  /** Email address to receive notifications about FixedFloat-based orders */
  draftEmail: string | null;
  /** WebLN provider. If null, window.webln is nonexistent or could not be enabled */
  webln: WebLNProvider | null;
  /** Direction of the swap */
  direction: Direction;
  /** Coin to be exchanged */
  coin: string;
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

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const boltz = useBoltz();
  const weblnRef = useRef<WebLNProvider | null>(null);
  const [value, setValue] = useState<Omit<AppState, "webln">>({
    direction: Direction.FromLightning,
    coin: boltz ? "BTC" : "ETH",
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
        }) as AppState,
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
