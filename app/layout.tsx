import { FediInjectionProvider, Icon, Text, ToastProvider } from "@fedibtc/ui";
import "@fedibtc/ui/dist/index.css";
import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import Fallback from "./components/fallback";
import "./globals.css";
import { AppStateProvider } from "./components/app-state-provider";
import { fixedFloat } from "@/lib/ff";
import { Suspense } from "react";
import Container from "./components/container";

const albertSans = Albert_Sans({ subsets: ["latin"] });

const env = process.env.NEXT_PUBLIC_ENV;

export const metadata: Metadata = {
  title: `Swap`,
  description: "Swap",
  icons: [
    env === "production"
      ? "logo.png"
      : env === "preview"
        ? "logo-preview.png"
        : "logo-dev.png",
  ],
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
          <FediInjectionProvider
            fediModName="Swap"
            minSupportedAPIVersion="legacy"
            supportedBitcoinNetworks={{
              signet: false,
              bitcoin: true,
            }}
          >
            <Fallback>
              <Suspense
                fallback={
                  <Container>
                    <Icon
                      icon="IconLoader2"
                      size="lg"
                      className="animate-spin text-lightGrey"
                    />
                    <Text>Fetching Rates...</Text>
                  </Container>
                }
              >
                <LoadedCurrencies>{children}</LoadedCurrencies>
              </Suspense>
            </Fallback>
          </FediInjectionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

async function LoadedCurrencies({ children }: { children: React.ReactNode }) {
  const currencies = await fixedFloat.currencies();

  return (
    <AppStateProvider currencies={currencies.data}>
      {children}
    </AppStateProvider>
  );
}
