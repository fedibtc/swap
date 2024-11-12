import { useEffect, useMemo, useState } from "react";
import Selector from "../components/selector";
import Flex from "../components/ui/flex";
import { Button, Text, Icon } from "@fedibtc/ui";
import {
  AppScreen,
  Direction,
  useAppState,
} from "../components/providers/app-state-provider";
import { getRate } from "../actions/get-rate";
import { decodeInvoice } from "@/lib/utils";
import { styled } from "react-tailwind-variants";
import { useBoltz } from "../components/providers/boltz-provider";
import { useFixedFloat } from "../components/providers/ff-provider";

export default function AmountScreen() {
  const {
    direction,
    coin,
    update,
    webln,
    draftAmount,
  } = useAppState();
  const boltz = useBoltz();
  const ff = useFixedFloat();
  const [amount, setAmount] = useState(
    draftAmount ?? boltz?.boltzFromLnRate.limits.minimal ?? 50000
  );
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [min, setMin] = useState(boltz?.boltzFromLnRate.limits.minimal ?? 50000);
  const [max, setMax] = useState(boltz?.boltzFromLnRate.limits.maximal ?? 25000000);

  const isAmountValid = useMemo(
    () => amount >= min && amount <= max,
    [amount, min, max]
  );

  const appendNumber = (number: number) => {
    const total = amount * 10 + number;

    if (String(total).length <= String(max).length) {
      setAmount(total);
    }
  };

  const deleteLastNumber = () => {
    setAmount(Math.floor(amount / 10));
  };

  const handleContinue = async () => {
    if (!isAmountValid) return;

    try {
      if (direction === Direction.ToLightning && webln) {
        const { paymentRequest } = await webln.makeInvoice(amount);

        if (paymentRequest) {
          if (paymentRequest.startsWith("lntbs"))
            throw new Error(
              "Invoice is for wrong network. Expected bitcoin, got testnet"
            );

          const decoded = decodeInvoice(paymentRequest);

          if (decoded.satoshis !== amount)
            throw new Error(
              `Invoice has wrong amount. Expected ${amount}, got ${decoded.satoshis}`
            );

          update({
            draftAmount: amount,
            draftAddress: paymentRequest,
            screen: AppScreen.Confirmation,
          });
        }
      } else {
        throw new Error("No Webln");
      }
    } catch {
      update({
        draftAmount: amount,
        screen: AppScreen.Address,
      });
    }
  };

  useEffect(() => {
    async function calculateRates() {
      setIsRateLoading(true);

      if (direction === Direction.FromLightning) {
        if (coin === "BTC") {
          if (!boltz) return;

          setMin(boltz.boltzFromLnRate.limits.minimal);
          setMax(boltz.boltzFromLnRate.limits.maximal);
        } else {
          const rate = await getRate("BTCLN", coin);

          setMin(Number(rate.from.min) * 100000000);
          setMax(Number(rate.from.max) * 100000000);
        }
      }

      if (direction === Direction.ToLightning) {
        if (coin === "BTC") {
          if (!boltz) return;

          setMin(boltz.boltzToLnRate.limits.minimal);
          setMax(boltz.boltzToLnRate.limits.maximal);
        } else {
          const rate = await getRate(coin, "BTCLN");

          setMin(Number(rate.to.min) * 100000000);
          setMax(Number(rate.to.max) * 100000000);
        }
      }

      setIsRateLoading(false);
    }

    calculateRates();
  }, [direction, coin, amount, boltz]);

  return (
    <Flex col p={4} width="full" className="h-screen pt-8">
      <Selector />
      <Flex col grow>
        {coin === "BTC" && !boltz && <Flex center p={2}>
          <Text variant="caption" className="text-center">
            <span className="text-red">
              Bitcoin &lt;&gt; Lightning swaps are not available at the moment. For more details, please check <a href="https://boltz.exchange" className="underline" target="_blank">boltz.exchange</a>
            </span>
          </Text>
        </Flex>}
        {coin !== "BTC" && !ff && <Flex center p={2}>
          <Text variant="caption" className="text-center">
            <span className="text-red">
              Non-Bitcoin &lt;&gt; Lightning swaps are not available at the moment. For more details, please check <a href="https://ff.io" className="underline" target="_blank">ff.io</a>
            </span>
          </Text>
        </Flex>}
        <Flex grow noBasis center col gap={2}>
          <Text variant="h1" weight="medium">
            {amount.toLocaleString()} <span className="text-grey">SATS</span>
          </Text>
          {amount > max && (
            <Text variant="caption">
              <span className="text-red">
                The max you can{" "}
                {direction === Direction.FromLightning ? "send" : "receive"} is{" "}
                <span className="underline" onClick={() => setAmount(max)}>
                  {max.toLocaleString()} SATS
                </span>
              </span>
            </Text>
          )}
          {amount < min && (
            <Text variant="caption">
              <span className="text-red">
                The minimum you can{" "}
                {direction === Direction.FromLightning ? "send" : "receive"} is{" "}
                <span className="underline" onClick={() => setAmount(min)}>
                  {min.toLocaleString()} SATS
                </span>
              </span>
            </Text>
          )}
        </Flex>
        <Flex col grow noBasis>
          <Flex width="full" gap={2}>
            <NumpadButton onClick={() => appendNumber(1)}>1</NumpadButton>
            <NumpadButton onClick={() => appendNumber(2)}>2</NumpadButton>
            <NumpadButton onClick={() => appendNumber(3)}>3</NumpadButton>
          </Flex>
          <Flex width="full" gap={2}>
            <NumpadButton onClick={() => appendNumber(4)}>4</NumpadButton>
            <NumpadButton onClick={() => appendNumber(5)}>5</NumpadButton>
            <NumpadButton onClick={() => appendNumber(6)}>6</NumpadButton>
          </Flex>
          <Flex width="full" gap={2}>
            <NumpadButton onClick={() => appendNumber(7)}>7</NumpadButton>
            <NumpadButton onClick={() => appendNumber(8)}>8</NumpadButton>
            <NumpadButton onClick={() => appendNumber(9)}>9</NumpadButton>
          </Flex>
          <Flex width="full" gap={2}>
            <NumpadButton disabled />
            <NumpadButton onClick={() => appendNumber(0)}>0</NumpadButton>
            <NumpadButton onClick={deleteLastNumber}>
              <Icon icon="IconArrowLeft" className="w-6 h-6" />
            </NumpadButton>
          </Flex>
        </Flex>
      </Flex>
      <Button onClick={handleContinue} disabled={isRateLoading || !isAmountValid}>
        Continue
      </Button>
    </Flex>
  );
}

const NumpadButton = styled("button", {
  base: "flex items-center justify-center rounded-lg bg-white active:bg-extraLightGrey disabled:pointer-events-none transition-colors grow basis-0 py-6 text-xl font-medium",
});
