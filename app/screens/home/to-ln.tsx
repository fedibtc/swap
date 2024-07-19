import { createOrder } from "@/app/actions/create-order";
import { getRate } from "@/app/actions/get-rate";
import { setOrderEmail } from "@/app/actions/set-email";
import {
  AppScreen,
  Direction,
  useAppState,
} from "@/app/components/app-state-provider";
import Flex from "@/app/components/ui/flex";
import FormInput from "@/app/components/form-input";
import { Button, useFediInjection, useToast } from "@fedibtc/ui";
import { useEffect, useState } from "react";

export default function ToLN() {
  const { rate, direction, isRateLoading, coin, update } = useAppState();
  const { webln } = useFediInjection();
  const toast = useToast();

  const minAmount =
    direction === Direction.ToLightning
      ? coin === "BTC"
        ? Number(rate.from.min) * 100000000
        : Number(rate.from.min)
      : 0;

  const maxAmount =
    direction === Direction.ToLightning
      ? coin === "BTC"
        ? Number(rate.from.max) * 100000000
        : Number(rate.from.max)
      : 0;

  const [amount, setAmount] = useState<string>(String(minAmount));
  const [email, setEmail] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);

  const isBitcoin = coin === "BTC";
  const amountLabel = isBitcoin ? "Sats" : coin;
  const amountNumber = Number(amount);

  const handleSubmit = async () => {
    setIsOrdering(true);
    try {
      const rate = await getRate(coin, "BTCLN");

      const btc = isBitcoin
        ? amountNumber / 100000000
        : +(amountNumber * Number(rate.from.rate)).toFixed(7);

      console.log(btc, "sats");
      console.log(rate);

      const { paymentRequest } = await webln.makeInvoice({
        amount: btc * 100000000,
      });

      const input = {
        fromCcy: coin,
        toCcy: "BTCLN",
        // 1/10th Fee
        amount: +btc.toFixed(8),
        direction: "to",
        type: "fixed",
        toAddress: paymentRequest,
      };

      const res = await createOrder(input);

      if (!res.success) {
        throw new Error(res.message);
      }

      if (email) {
        await setOrderEmail({
          id: res.data.id,
          token: res.data.token,
          email: email,
        });
      }

      update({
        exchangeOrder: {
          id: res.data.id,
          token: res.data.token,
        },
        screen: AppScreen.Status,
      });
    } catch (e) {
      toast.error(e);
    } finally {
      setIsOrdering(false);
    }
  };

  useEffect(() => {
    if (direction === Direction.ToLightning) {
      setAmount((a) => {
        const amt = Number(a);

        return String(
          amt < minAmount ? minAmount : amt > maxAmount ? maxAmount : amt,
        );
      });
    }
  }, [direction, minAmount, maxAmount]);
  return (
    <Flex col gap={4} width="full" grow>
      <Flex col gap={4} grow>
        <FormInput
          label={`Amount (${amountLabel})`}
          description="Not including 10% exchange fee"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          inputMode="decimal"
          step="any"
          error={
            amountNumber < minAmount
              ? `Min ${minAmount} ${amountLabel}`
              : amountNumber > maxAmount
                ? `Max ${maxAmount} ${amountLabel}`
                : undefined
          }
          disabled={isRateLoading}
        />
        <FormInput
          label="Email Address (optional)"
          description="Subscribe to updates from FixedFloat. Recommended for large exchanges."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="john@doe.com"
          disabled={isRateLoading}
        />
      </Flex>
      <Flex col>
        <Button onClick={handleSubmit} loading={isOrdering}>
          Exchange
        </Button>
      </Flex>
    </Flex>
  );
}
