import { Direction, useAppState } from "@/app/components/app-state-provider";
import Flex from "@/app/components/flex";
import FormInput from "@/app/components/form-input";
import { Button, Dialog, Icon, Scanner, Text } from "@fedibtc/ui";
import { useEffect, useState } from "react";

export default function FromLN() {
  const { rate, direction, isRateLoading, coin, currencies } = useAppState();
  const minAmountSats =
    direction === Direction.FromLightning
      ? Number(rate.from.min) * 100000000
      : 0;
  const [amount, setAmount] = useState<number>(minAmountSats);
  const [address, setAddress] = useState("");
  const [scanning, setScanning] = useState(false);
  const [email, setEmail] = useState("");

  const currentCurrency = currencies.find((c) => c.code === coin);

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

  useEffect(() => {
    if (direction === Direction.FromLightning) {
      setAmount(amt => amt > minAmountSats ? amt : minAmountSats);
    }
  }, [direction, minAmountSats])

  return (
    <Flex col gap={4} width="full" grow>
      <Flex col gap={4} grow>
        <FormInput
          label="Amount (Sats)"
          value={String(amount)}
          onChange={(e) => setAmount(Number(e.target.value))}
          type="number"
          inputMode="decimal"
          step="any"
          error={
            amount < minAmountSats ? `Min ${minAmountSats} sats` : undefined
          }
          disabled={isRateLoading}
        />
        <FormInput
          label={`${currentCurrency?.name} Address`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={coin === "BTC" ? "bc1..." : "0x..."}
          disabled={isRateLoading}
          inputRight={
            <button
              className="flex items-center justify-center border-solid border-2 border-lightGrey rounded-lg w-12 h-12 active:bg-extraLightGrey shrink-0"
              onClick={() => setScanning(true)}
            >
              <Icon icon="IconQrcode" className="w-6 h-6" />
            </button>
          }
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
          <button
            onClick={handlePaste}
            className="flex w-full p-4 rounded-lg active:bg-extraLightGrey"
          >
            <Flex row gap={2} align="center" justify="start" width="full" grow>
              <Icon icon="IconClipboard" className="w-6 h-6" />
              <Text weight="medium">Paste</Text>
            </Flex>
          </button>
        </Flex>
      </Dialog>
    </Flex>
  );
}
