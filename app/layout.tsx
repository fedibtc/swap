import { FediInjectionProvider, ToastProvider } from "@fedibtc/ui";
import "@fedibtc/ui/dist/index.css";
import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import Fallback from "./components/fallback";
import "./globals.css";

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
            <Fallback>{children}</Fallback>
          </FediInjectionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
