import { Icon, Text, ToastProvider } from "@fedibtc/ui";
import "@fedibtc/ui/dist/index.css";
import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import "./globals.css";
import {
  AppStateProvider,
  BoltzFromLnRate,
  BoltzToLnRate,
} from "./components/app-state-provider";
import { fixedFloat } from "@/lib/ff";
import { Suspense } from "react";
import Container from "./components/container";
import { Currency } from "@/lib/ff/types";
import { boltzEndpoint } from "@/lib/constants";

const albertSans = Albert_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Swap`,
  description: "Swap",
  icons: ["logo.png"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={albertSans.className}>
        <ToastProvider>
          <Container>
            <Suspense
              fallback={
                <>
                  <Icon
                    icon="IconLoader2"
                    size="lg"
                    className="animate-spin text-lightGrey"
                  />
                  <Text>Fetching Rates...</Text>
                </>
              }
            >
              <LoadedCurrencies>{children}</LoadedCurrencies>
            </Suspense>
          </Container>
        </ToastProvider>
      </body>
    </html>
  );
}

async function LoadedCurrencies({ children }: { children: React.ReactNode }) {
  let currencies: Array<Currency> | null = null;
  let boltzToLnRate: BoltzToLnRate | null = null;
  let boltzFromLnRate: BoltzFromLnRate | null = null;

  try {
    currencies = await new Promise(async (resolve, reject) => {
      setTimeout(() => reject(new Error("timeout")), 5000);
      const currencies = await fixedFloat.currencies();

      if (Array.isArray(currencies.data)) {
        resolve(currencies.data);
      } else {
        throw new Error("invalid currencies");
      }
    });
  } catch {
    /* no-op */
  }

  try {
    boltzToLnRate = (
      await fetch(`${boltzEndpoint}/v2/swap/submarine`).then((res) =>
        res.json()
      )
    ).BTC.BTC;
  } catch {
    /* no-op */
  }

  try {
    boltzFromLnRate = (
      await fetch(`${boltzEndpoint}/v2/swap/reverse`).then((res) => res.json())
    ).BTC.BTC;
  } catch {
    /* no-op */
  }

  return (
    <AppStateProvider
      currencies={currencies || null}
      boltzToLnRate={boltzToLnRate}
      boltzFromLnRate={boltzFromLnRate}
    >
      {children}
    </AppStateProvider>
  );
}

// TODO: move to separate page to prevent caching, don't do state in layout
export const dynamic = "force-dynamic";
