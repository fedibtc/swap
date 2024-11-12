import "@fedibtc/ui/dist/index.css";
import "./globals.css";
import { AppStateProvider } from "./components/providers/app-state-provider";
import { fixedFloat } from "@/lib/ff";
import Container from "./components/container";
import { Currency } from "@/lib/ff/types";
import { boltzEndpoint } from "@/lib/constants";
import Content from "./content";
import {
  BoltzFromLnRate,
  BoltzProvider,
  BoltzToLnRate,
} from "./components/providers/boltz-provider";
import { FixedFloatProvider } from "./components/providers/ff-provider";

export default async function Index() {
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
    <Container>
      <FixedFloatProvider currencies={currencies}>
        <BoltzProvider
          boltzToLnRate={boltzToLnRate}
          boltzFromLnRate={boltzFromLnRate}
        >
          <AppStateProvider>
            <Content />
          </AppStateProvider>
        </BoltzProvider>
      </FixedFloatProvider>
    </Container>
  );
}

export const dynamic = "force-dynamic";
