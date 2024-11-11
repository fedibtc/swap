import { useCallback, useMemo } from "react";
import { Direction, useAppState } from "../components/app-state-provider";

export function useAmount() {
  const { boltzToLnRate, boltzFromLnRate, direction, coin, draftAmount } =
    useAppState();

  if (!boltzToLnRate || !boltzFromLnRate)
    throw new Error(
      "useBoltz can only be used if boltzToLnRate and boltzFromLnRate are defined"
    );

  const calculateBoltzInput = useCallback(
    (desiredOutput: number, networkFee: number, providerFeeRate: number) => {
      return Math.ceil(
        (desiredOutput + networkFee) * (1 / (1 - providerFeeRate / 100))
      );
    },
    []
  );

  const networkFees = useMemo(() => {
    if (coin !== "BTC") return 0;

    if (direction === Direction.FromLightning) {
      return (
        boltzFromLnRate.fees.minerFees.lockup +
        boltzFromLnRate.fees.minerFees.claim
      );
    } else {
      return boltzToLnRate.fees.minerFees;
    }
  }, [direction, boltzToLnRate, boltzFromLnRate, coin]);

  const inputAmount = useMemo(() => {
    if (!draftAmount) return 0;

    // 1% fixed fee
    if (coin !== "BTC") {
      return draftAmount / 0.99;
    }

    if (direction === Direction.FromLightning) {
      return calculateBoltzInput(
        draftAmount,
        networkFees,
        boltzFromLnRate.fees.percentage
      );
    } else {
      return calculateBoltzInput(
        draftAmount,
        networkFees,
        boltzToLnRate.fees.percentage
      );
    }
  }, [
    boltzToLnRate,
    boltzFromLnRate,
    direction,
    draftAmount,
    networkFees,
    coin,
    calculateBoltzInput,
  ]);

  const swapFees = useMemo(() => {
    if (!draftAmount) return 0;

    return inputAmount - draftAmount;
  }, [inputAmount, draftAmount]);

  return { swapFees, inputAmount, networkFees };
}
