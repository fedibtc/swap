import "@fedibtc/ui/dist/index.css";
import "./globals.css";
import { AppStateProvider } from "./components/providers/app-state-provider";
import { fixedFloat } from "@/lib/ff";
import Container from "./components/container";
import { Currency } from "@/lib/ff/types";
import Content from "./content";
import { BoltzProvider } from "./components/providers/boltz-provider";
import { FixedFloatProvider } from "./components/providers/ff-provider";
import { boltz } from "@/lib/boltz";
import { ReverseSwapRate, SubmarineSwapRate } from "@/lib/boltz/types";

export default async function Index() {
  let currencies: Array<Currency> | null = null;
  let boltzToLnRate: SubmarineSwapRate | null = null;
  let boltzFromLnRate: ReverseSwapRate | null = null;

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
    const rate = await boltz.submarineSwapRate();
    boltzToLnRate = rate.BTC.BTC;
  } catch {
    /* no-op */
  }

  try {
    const rate = await boltz.reverseSwapRate();
    boltzFromLnRate = rate.BTC.BTC;
  } catch {
    /* no-op */
  }

  return (
    <Container>
      <FixedFloatProvider currencies={currencies}>
        <BoltzProvider
          initialBoltzToLnRate={boltzToLnRate}
          initialBoltzFromLnRate={boltzFromLnRate}
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
