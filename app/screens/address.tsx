import { useCallback, useEffect, useMemo, useState } from "react";
import Flex from "../components/ui/flex";
import { AppScreen, useAppState, Direction,
} from "../components/providers/app-state-provider";
import SwapIndicator from "../components/swap-indicator";
import { Input, Text, Icon, Button, Dialog, Scanner } from "@fedibtc/ui";
import { currencyStats } from "@/lib/constants";
import { styled } from "react-tailwind-variants";
import { decodeInvoice } from "@/lib/utils";
import { formatError } from "@/lib/errors";

export default function AddressScreen() {
  const {
    draftAmount,
    draftAddress,
    draftEmail,
    update,
    webln,
    direction,
    coin,
  } = useAppState();

  const [address, setAddress] = useState<null | string>(draftAddress);
  const [email, setEmail] = useState<string | null>(draftEmail);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [isAndroidWebview, setIsAndroidWebview] = useState(false);

  const coinInfo = currencyStats.find((c) => c.code === coin);

  const placeholder =
    direction === Direction.ToLightning
      ? "lnbc..."
      : coin === "BTC"
        ? "bc1..."
        : "0x...";

  if (!draftAmount) throw new Error("Invalid address state");

  const checkAddressValidity = useCallback(
    (addr: string) => {
      if (!addr) throw new Error("No address");

      if (direction === Direction.ToLightning) {
        if (addr.startsWith("lntbs"))
          throw new Error(
            "Invoice is for wrong network. Expected bitcoin, got testnet",
          );

        const decoded = decodeInvoice(addr);

        if (decoded.satoshis !== draftAmount)
          throw new Error(
            `Invoice has wrong amount. Expected ${draftAmount}, got ${decoded.satoshis}`,
          );
      } else if (coin === "BTC") {
        if (
          addr.startsWith("tb1") ||
          addr.startsWith("2") ||
          addr.startsWith("m") ||
          addr.startsWith("n")
        )
          throw new Error("Address is for wrong network");

        if (
          !addr.startsWith("bc1") &&
          !addr.startsWith("1") &&
          !addr.startsWith("3")
        )
          throw new Error("Invalid bitcoin address");

        if (addr.length < 26 || addr.length > 42)
          throw new Error("Invalid bitcoin address");
      } else if (coin === "USDTTRC") {
        if (!addr.startsWith("T") || addr.length !== 34)
          throw new Error("Invalid tron address");
      } else {
        if (!addr.startsWith("0x") || addr.length !== 42)
          throw new Error("Invalid ethereum address");
      }
    },
    [coin, direction, draftAmount],
  );

  const isAddressValid = useMemo(() => {
    if (!address) return false;

    setError(null);

    try {
      checkAddressValidity(address);

      return true;
    } catch (e) {
      setError(formatError(e));
      return false;
    }
  }, [address, checkAddressValidity]);

  const handleLightning = useCallback(async () => {
    if (!webln || !draftAmount) return;

    try {
      const { paymentRequest } = await webln.makeInvoice(draftAmount);

      setAddress(paymentRequest);

      checkAddressValidity(paymentRequest);

      update({
        draftAddress: paymentRequest,
        screen: AppScreen.Confirmation,
      });
    } catch {
      /* no-op */
    }
  }, [webln, draftAmount, checkAddressValidity, update]);

  const handleContinue = useCallback(async () => {
    if (!isAddressValid) return;

    update({
      draftAddress: address,
      draftEmail: email,
      screen: AppScreen.Confirmation,
    });
  }, [address, email, update, isAddressValid]);

  const handlePaste = useCallback(() => {
    navigator.clipboard
      .readText()
      .then((res) => {
        setAddress(res);
        try {
          checkAddressValidity(res);

          if (coin === "BTC") {
            update({
              draftAddress: res,
              screen: AppScreen.Confirmation,
            });
          }
        } catch {
          /* no-op */
        }
      })
      .catch(() => {});
  }, [checkAddressValidity, update, coin]);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    if (ua.indexOf("wv") > -1 && ua.indexOf("android") > -1) {
      setIsAndroidWebview(true);
    }
  }, []);

  return (
    <Flex col width="full" className="h-screen p-4 pt-2">
      <SwapIndicator
        onBack={() => {
          update({
            screen: AppScreen.Home,
          });
        }}
      />
      <Flex col gap={8} className="py-4" grow>
        <Flex col gap={4}>
          <Flex col gap={2}>
            <Text weight="medium">
              Enter destination{" "}
              {direction === Direction.ToLightning
                ? "lightning invoice"
                : `${coinInfo?.name} address`}
            </Text>
            <Flex className="relative">
              <Input
                value={address ?? ""}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={placeholder}
                adornment={
                  <Flex className="pr-0.5">
                    <QrScannerButton onClick={() => setScanning(true)}>
                      <Icon icon="IconScan" size="sm" />
                    </QrScannerButton>
                  </Flex>
                }
              />
            </Flex>
            {error && (
              <Text variant="caption">
                <span className="text-red">{error}</span>
              </Text>
            )}
          </Flex>
          {webln && direction === Direction.ToLightning && (
            <Button onClick={handleLightning}>Create Invoice via WebLN</Button>
          )}
          {!isAndroidWebview && (
            <Button variant="offWhite" onClick={handlePaste}>
              Paste{" "}
              {direction === Direction.FromLightning
                ? `${coinInfo?.name.split(" ")[0]} address`
                : "Lightning invoice"}
            </Button>
          )}
        </Flex>
        {coin !== "BTC" && (
          <Flex col gap={1} asChild>
            <label>
              <Flex row gap={2} justify="between" align="center">
                <Text weight="medium">Email Address (optional)</Text>
              </Flex>
              <Text variant="caption">
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
              </Text>
              <Flex row gap={2} align="center">
                <Input
                  value={email ?? ""}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="john@doe.com"
                />
              </Flex>
            </label>
          </Flex>
        )}
        <Dialog open={scanning} onOpenChange={setScanning} title="Scan QR Code">
          <Flex col className="pt-4" grow>
            <Flex>
              <Scanner
                scanning={scanning}
                onResult={(data) => {
                  setAddress(data);
                  setScanning(false);
                }}
                onError={console.error}
              />
            </Flex>
          </Flex>
          <Button onClick={() => setScanning(false)} variant="outline">
            Cancel
          </Button>
        </Dialog>
      </Flex>
      <Button
        onClick={handleContinue}
        disabled={Boolean(error || !isAddressValid)}
      >
        Continue
      </Button>
    </Flex>
  );
}

const QrScannerButton = styled("button", {
  base: "flex rounded-lg p-2 items-center justify-center active:bg-extraLightGrey transition-colors disabled:pointer-events-none disabled:opacity-50",
});
