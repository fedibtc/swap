import { Direction, useAppState } from "@/app/components/app-state-provider";
import Flex from "@/app/components/flex";
import FormInput from "@/app/components/form-input";
import { Button } from "@fedibtc/ui";
import { useEffect, useState } from "react";

export default function ToLN() {
  const { rate, direction, isRateLoading, coin } = useAppState();
  const minAmount =
    direction === Direction.ToLightning
      ? coin === "BTC"
        ? Number(rate.from.min) * 100000000
        : Number(rate.from.min)
      : 0;
  const [amount, setAmount] = useState<number>(minAmount);
  const [email, setEmail] = useState("");

  const amountLabel = coin === "BTC" ? "Sats" : coin;

  useEffect(() => {
    if (direction === Direction.ToLightning) {
      setAmount((amt) => (amt > minAmount ? amt : minAmount));
    }
  }, [direction, minAmount]);

  return (
    <Flex col gap={4} width="full" grow>
      <Flex col gap={4} grow>
        <FormInput
          label={`Amount (${amountLabel})`}
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
        <Button>Exchange</Button>
      </Flex>
    </Flex>
  );
}
