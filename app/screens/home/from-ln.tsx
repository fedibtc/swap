import { createOrder } from "@/app/actions/create-order";
import { setOrderEmail } from "@/app/actions/set-email";
import {
  AppScreen,
  AppStateFF,
  Direction,
  useAppState,
} from "@/app/components/app-state-provider";
import Flex from "@/app/components/ui/flex";
import FormInput from "@/app/components/form-input";
import { Button, Dialog, Icon, Scanner, Text, useToast } from "@fedibtc/ui";
import { useEffect, useState } from "react";
import { styled } from "react-tailwind-variants";
import { PriceData } from "@/lib/ff/types";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { currencyStats } from "@/lib/constants";

export default function FromLN({
  rate,
  isRateLoading,
}: {
  rate: PriceData | null;
  isRateLoading: boolean;
}) {
  const {
    direction,
    coin,
    update,
    isFFBroken,
  } = useAppState<AppStateFF>();

  const minAmountSats =
    direction === Direction.FromLightning
      ? Number(rate?.from.min) * 100000000
      : 0;

  const maxAmountSats =
    direction === Direction.FromLightning
      ? Number(rate?.from.max) * 100000000
      : 0;

  const [amount, setAmount] = useState<string>(String(minAmountSats));
  const [address, setAddress] = useState("");
  const [scanning, setScanning] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  const currentCurrency = currencyStats.find((c) => c?.code === coin);
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
    setIsSubmitting(true);
    try {
      let correctedAmount = amountNumber / 100000000;

      const res = await createOrder({
        fromCcy: "BTCLN",
        toCcy: coin,
        // 1/10th Fee
        amount: correctedAmount + correctedAmount / 100,
        direction: "from",
        type: "fixed",
        toAddress: address,
      });

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

      // TODO: Pay from-ln in status page
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
      setIsSubmitting(false);
    }
  };

  const isAmountValid =
    amountNumber >= minAmountSats && amountNumber <= maxAmountSats;

  useEffect(() => {
    if (direction === Direction.FromLightning) {
      setAmount((a) => {
        const amt = Number(a);

        return String(
          amt < minAmountSats
            ? minAmountSats
            : amt > maxAmountSats
            ? maxAmountSats
            : amt
        );
      });
    }
  }, [direction, minAmountSats, maxAmountSats]);

  if (isFFBroken)
    return (
      <StatusBanner status="warning">
        <Text>
          The FixedFloat API is currently unavailable. For more updates, please
          check{" "}
          <a href="https://ff.io" target="_blank" className="underline">
            ff.io
          </a>
        </Text>
      </StatusBanner>
    );

  return (
    <Flex col gap={4} width="full" grow>
      <Flex col gap={4} grow>
        <FormInput
          label="Amount (Sats)"
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
            amountNumber < minAmountSats
              ? `Min ${minAmountSats} sats`
              : amountNumber > maxAmountSats
              ? `Max ${maxAmountSats} sats`
              : undefined
          }
          disabled={isRateLoading}
        />
        <FormInput
          label={`${currentCurrency?.network} Address`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={"0x..."}
          disabled={isRateLoading}
          inputRight={
            <ScannerButton onClick={() => setScanning(true)}>
              <Icon icon="IconQrcode" className="w-6 h-6" />
            </ScannerButton>
          }
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
          loading={isSubmitting}
          disabled={!isAmountValid}
        >
          Exchange
        </Button>
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

export const ScannerButton = styled("button", {
  base: "flex items-center justify-center border-solid border-2 border-lightGrey rounded-lg w-12 h-12 active:bg-extraLightGrey shrink-0",
});

export const PasteButton = styled("button", {
  base: "flex w-full p-4 rounded-lg active:bg-extraLightGrey",
});
