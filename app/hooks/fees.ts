import { PriceData, RateInfo } from "@/lib/ff/types";
import { useMemo } from "react";
import {
  Direction,
  useAppState,
} from "../components/providers/app-state-provider";
import { useBoltz } from "../components/providers/boltz-provider";
import { useFixedFloat } from "../components/providers/ff-provider";

const calculateTargetAmount = (
  desiredOutput: number,
  networkFee: number,
  providerFeeRate: number,
) => {
  return Math.ceil(
    (desiredOutput + networkFee) * (1 / (1 - providerFeeRate / 100)),
  );
};

export default function useFees(
  relativeRate: PriceData | null,
  absoluteRate: RateInfo | null,
) {
  const { coin, direction, draftAmount } = useAppState();
  const boltz = useBoltz();
  const ff = useFixedFloat();

  const networkFees = useMemo(() => {
    if (!draftAmount) return 0;

    if (coin === "BTC") {
      if (!boltz) return 0;

      if (direction === Direction.FromLightning) {
        return (
          boltz.boltzFromLnRate.fees.minerFees.lockup +
          boltz.boltzFromLnRate.fees.minerFees.claim
        );
      } else {
        return boltz.boltzToLnRate.fees.minerFees;
      }
    } else {
      if (!ff || !relativeRate || !absoluteRate) return 0;

      const inputAmount = relativeRate.from.btc * 100000000;
      const ffFee = inputAmount / 100;

      return inputAmount - draftAmount - ffFee;
    }
  }, [draftAmount, boltz, coin, direction, ff, absoluteRate, relativeRate]);

  const providerFees = useMemo(() => {
    if (!draftAmount) return 0;

    if (coin === "BTC") {
      if (!boltz) return 0;

      if (direction === Direction.FromLightning) {
        return (
          calculateTargetAmount(
            draftAmount,
            networkFees,
            boltz.boltzFromLnRate.fees.percentage,
          ) -
          draftAmount -
          networkFees
        );
      } else {
        return (
          calculateTargetAmount(
            draftAmount,
            networkFees,
            boltz.boltzToLnRate.fees.percentage,
          ) -
          draftAmount -
          networkFees
        );
      }
    } else {
      if (!ff || !relativeRate || !absoluteRate) return 0;

      const inputAmount = relativeRate.from.btc * 100000000;

      return inputAmount / 100;
    }
  }, [
    draftAmount,
    boltz,
    coin,
    direction,
    networkFees,
    ff,
    relativeRate,
    absoluteRate,
  ]);

  const totalFees = useMemo(
    () => networkFees + providerFees,
    [networkFees, providerFees],
  );

  return {
    networkFees,
    providerFees,
    totalFees,
  };
}
