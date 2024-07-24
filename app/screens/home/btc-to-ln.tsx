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
  const { update } = useAppState<AppStateBoltzToLn>();
  const { webln } = useFediInjection();
  const [amount, setAmount] = useState<string>(String(minAmountSats));
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
          error={
            amountNumber < minAmountSats
              ? `Min ${minAmountSats} sats`
              : amountNumber > maxAmountSats
                ? `Max ${maxAmountSats} sats`
                : undefined
          }
        />
      </Flex>
      <Button onClick={handleSubmit}>Exchange</Button>
    </Flex>
  );
}
