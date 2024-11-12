import { useCallback, useMemo } from "react";
import {
  Direction,
  useAppState,
} from "../components/providers/app-state-provider";
import { useBoltz } from "../components/providers/boltz-provider";

export function useAmount() {
  const { direction, coin, draftAmount } = useAppState();
  const boltz = useBoltz();

  const calculateBoltzInput = useCallback(
    (desiredOutput: number, networkFee: number, providerFeeRate: number) => {
      return Math.ceil(
        (desiredOutput + networkFee) * (1 / (1 - providerFeeRate / 100))
      );
    },
    []
  );

  const networkFees = useMemo(() => {
    if (coin !== "BTC" || !boltz) return 0;

    if (direction === Direction.FromLightning) {
      return (
        boltz.boltzFromLnRate.fees.minerFees.lockup +
        boltz.boltzFromLnRate.fees.minerFees.claim
      );
    } else {
      return boltz.boltzToLnRate.fees.minerFees;
    }
  }, [direction, boltz, coin]);

  const inputAmount = useMemo(() => {
    if (!draftAmount) return 0;

    // 1% fixed fee
    if (coin !== "BTC" || !boltz) {
      return draftAmount / 0.99;
    }

    if (direction === Direction.FromLightning) {
      return calculateBoltzInput(
        draftAmount,
        networkFees,
        boltz.boltzFromLnRate
          .fees.percentage
      );
    } else {
      return calculateBoltzInput(
        draftAmount,
        networkFees,
        boltz.boltzToLnRate.fees.percentage
      );
    }
  }, [boltz, direction, draftAmount, networkFees, coin, calculateBoltzInput]);

  const swapFees = useMemo(() => {
    if (!draftAmount) return 0;

    return inputAmount - draftAmount;
  }, [inputAmount, draftAmount]);

  return { swapFees, inputAmount, networkFees };
}
