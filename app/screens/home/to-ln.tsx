import { createOrder } from "@/app/actions/create-order";
import { getRate } from "@/app/actions/get-rate";
import { setOrderEmail } from "@/app/actions/set-email";
import {
  AppScreen,
  Direction,
  useAppState,
} from "@/app/components/app-state-provider";
import Flex from "@/app/components/flex";
import FormInput from "@/app/components/form-input";
import { Button, useFediInjection, useToast } from "@fedibtc/ui";
import { useEffect, useState } from "react";

export default function ToLN() {
  const { rate, direction, isRateLoading, coin, update } = useAppState();
  const minAmount =
    direction === Direction.ToLightning
      ? coin === "BTC"
        ? Number(rate.from.min) * 100000000
        : Number(rate.from.min)
      : 0;
  const [amount, setAmount] = useState<number>(minAmount);
  const [email, setEmail] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);

  const { webln } = useFediInjection();
  const toast = useToast();

  const isBitcoin = coin === "BTC";

  const amountLabel = isBitcoin ? "Sats" : coin;

  useEffect(() => {
    if (direction === Direction.ToLightning) {
      setAmount((amt) => (amt > minAmount ? amt : minAmount));
    }
  }, [direction, minAmount]);

  const handleSubmit = async () => {
    setIsOrdering(true);
    try {
      const rate = await getRate(coin, "BTCLN");

      const btc = isBitcoin
        ? amount / 100000000
        : +(amount * Number(rate.from.rate)).toFixed(7);

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
          fromAmount: Number(res.data.from.amount),
          toAmount: Number(res.data.to.amount),
          payAddress: res.data.from.address,
        },
        orderStatus: res.data.status,
        screen: AppScreen.Status,
      });
    } catch (e) {
      toast.error(e);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <Flex col gap={4} width="full" grow>
      <Flex col gap={4} grow>
        <FormInput
          label={`Amount (${amountLabel})`}
          description="Not including 10% exchange fee"
          value={String(amount)}
          onChange={(e) => setAmount(Number(e.target.value))}
          type="number"
          inputMode="decimal"
          step="any"
          error={
            amount < minAmount ? `Min ${minAmount} ${amountLabel}` : undefined
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
