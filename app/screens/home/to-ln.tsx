import { createOrder } from "@/app/actions/create-order";
import { getRate } from "@/app/actions/get-rate";
import { setOrderEmail } from "@/app/actions/set-email";
import {
  AppScreen,
  AppStateFF,
  Direction,
  useAppState,
} from "@/app/components/app-state-provider";
import Flex from "@/app/components/ui/flex";
import FormInput from "@/app/components/form-input";
import { Button, useFediInjection, useToast } from "@fedibtc/ui";
import { useEffect, useState } from "react";
import { PriceData } from "@/lib/ff/types";

export default function ToLN({
  rate,
  isRateLoading,
}: {
  rate: PriceData | null;
  isRateLoading: boolean;
}) {
  const { direction, coin, update } = useAppState<AppStateFF>();
  const { webln } = useFediInjection();
  const toast = useToast();

  const minAmount =
    direction === Direction.ToLightning ? Number(rate?.from.min) : 0;

  const maxAmount =
    direction === Direction.ToLightning ? Number(rate?.from.max) : 0;

  const [amount, setAmount] = useState<string>(String(minAmount));
  const [email, setEmail] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);

  const amountNumber = Number(amount);

  const handleSubmit = async () => {
    setIsOrdering(true);
    try {
      const rate = await getRate(coin, "BTCLN");
      const btc = +(amountNumber * Number(rate.from.rate)).toFixed(7);

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

  const isAmountValid = amountNumber >= minAmount && amountNumber <= maxAmount;

  return (
    <Flex col gap={4} width="full" grow>
      <Flex col gap={4} grow>
        <FormInput
          label={`Amount (${coin})`}
          description={
            <>
              Not including 1% network exchange fee from{" "}
              <a
                href="https://ff.io"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                FixedFloat
              </a>
            </>
          }
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          inputMode="decimal"
          step="any"
          error={
            amountNumber < minAmount
              ? `Min ${minAmount} ${coin}`
              : amountNumber > maxAmount
                ? `Max ${maxAmount} ${coin}`
                : undefined
          }
          disabled={isRateLoading}
        />
        <FormInput
          label="Email Address (optional)"
          description={
            <>
              Subscribe to updates from{" "}
              <a
                href="https://ff.io"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                FixedFloat
              </a>
              . Recommended for large exchanges.
            </>
          }
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="john@doe.com"
          disabled={isRateLoading}
        />
      </Flex>
      <Flex col>
        <Button
          onClick={handleSubmit}
          loading={isOrdering}
          disabled={!isAmountValid}
        >
          Exchange
        </Button>
      </Flex>
    </Flex>
  );
}
