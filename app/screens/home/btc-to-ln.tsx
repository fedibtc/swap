import {
  AppScreen,
  AppStateBoltzToLn,
  useAppState,
} from "@/app/components/app-state-provider";
import FormInput from "@/app/components/form-input";
import Flex from "@/app/components/ui/flex";
import { maxAmountSats, minAmountSats } from "@/lib/constants";
import { Button, useFediInjection, useToast } from "@fedibtc/ui";
import { useState } from "react";

export default function BtcToLn() {
  const { update, boltzToLnRate } = useAppState<AppStateBoltzToLn>();

  let minAmount = minAmountSats;
  let maxAmount = maxAmountSats;

  if (boltzToLnRate) {
    minAmount = boltzToLnRate.limits.minimal + (boltzToLnRate.limits.minimal * boltzToLnRate.fees.percentage / 100) + boltzToLnRate.fees.minerFees;
    maxAmount = boltzToLnRate.limits.maximal + (boltzToLnRate.limits.maximal * boltzToLnRate.fees.percentage / 100) + boltzToLnRate.fees.minerFees;
  }

  const { webln } = useFediInjection();
  const [amount, setAmount] = useState<string>(String(minAmount));
  const toast = useToast();

  const amountNumber = Number(amount);

  const handleSubmit = async () => {
    try {
      const invoice = await webln.makeInvoice({
        amount: amountNumber,
      });

      update({
        exchangeOrder: {
          amount: amountNumber,
          invoice: invoice.paymentRequest,
        },
        screen: AppScreen.ToLnStatus,
      });
    } catch (error) {
      toast.error(error);
    }
  };

  const isAmountValid =
    amountNumber >= minAmount && amountNumber <= maxAmount;

  return (
    <Flex col gap={4} width="full" grow>
      <Flex col gap={4} grow>
        <FormInput
          label="Amount (Sats)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          inputMode="decimal"
          step="any"
          description={
            <>
              Not including 0.1% exchange fee from{" "}
              <a
                href="https://boltz.exchange"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Boltz
              </a>
            </>
          }
          error={
            amountNumber < minAmount
              ? `Min ${minAmount} sats`
              : amountNumber > maxAmount
                ? `Max ${maxAmount} sats`
                : undefined
          }
        />
      </Flex>
      <Button onClick={handleSubmit} disabled={!isAmountValid}>
        Exchange
      </Button>
    </Flex>
  );
}
