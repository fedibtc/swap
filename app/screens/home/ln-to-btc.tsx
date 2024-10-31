import {
  AppScreen,
  AppStateBoltzFromLn,
  useAppState,
} from "@/app/components/app-state-provider";
import FormInput from "@/app/components/form-input";
import Flex from "@/app/components/ui/flex";
import { maxAmountSats, minAmountSats } from "@/lib/constants";
import { Button, Dialog, Icon, Scanner, Text } from "@fedibtc/ui";
import { useState } from "react";
import { PasteButton, ScannerButton } from "./from-ln";

export default function LnToBtc() {
  const { update, boltzFromLnRate } = useAppState<AppStateBoltzFromLn>();
  const [address, setAddress] = useState("");
  const [scanning, setScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  let minAmount = minAmountSats;
  let maxAmount = maxAmountSats;

  if (boltzFromLnRate) {
    minAmount = boltzFromLnRate.limits.minimal;
    maxAmount = boltzFromLnRate.limits.maximal;
  }

  const [amount, setAmount] = useState<string>(String(minAmount));

  const amountNumber = Number(amount);

  const handleScan = (data: string) => {
    setAddress(data);
    setScanning(false);
  };

  const handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        setAddress(text);
      })
      .catch(() => {
        setAddress(prompt("Paste your address here") ?? "");
      })
      .finally(() => {
        setScanning(false);
      });
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    update({
      exchangeOrder: {
        address,
        amount: amountNumber,
      },
      screen: AppScreen.FromLnStatus,
    });
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
              Not including 0.5% exchange fee from{" "}
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
        <FormInput
          label={`Bitcoin Address`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={"bc1..."}
          inputRight={
            <ScannerButton onClick={() => setScanning(true)}>
              <Icon icon="IconQrcode" className="w-6 h-6" />
            </ScannerButton>
          }
        />
      </Flex>
      <Button
        onClick={handleSubmit}
        loading={isLoading}
        disabled={!isAmountValid}
      >
        Exchange
      </Button>
      <Dialog
        open={scanning}
        onOpenChange={(open) => setScanning(open)}
        title="Scan QR Code"
      >
        <Flex col gap={2} className="pt-4" justify="between" grow>
          <Scanner
            scanning={scanning}
            onResult={handleScan}
            onError={console.log}
          />
          <PasteButton onClick={handlePaste}>
            <Flex row gap={2} align="center" justify="start" width="full" grow>
              <Icon icon="IconClipboard" className="w-6 h-6" />
              <Text weight="medium">Paste</Text>
            </Flex>
          </PasteButton>
        </Flex>
      </Dialog>
    </Flex>
  );
}
