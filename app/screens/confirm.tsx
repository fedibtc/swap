import { styled } from "react-tailwind-variants";
import {
  AppScreen,
  Direction,
  useAppState,
} from "../components/providers/app-state-provider";
import SwapIndicator from "../components/swap-indicator";
import Flex from "../components/ui/flex";
import { Button, Text, Icon, useToast } from "@fedibtc/ui";
import { currencyStats, lightningCurrency } from "@/lib/constants";
import { useCallback, useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { createOrder } from "../actions/create-order";
import { setOrderEmail } from "../actions/set-email";
import { useBoltz } from "../components/providers/boltz-provider";
import { useFixedFloat } from "../components/providers/ff-provider";
import { PriceData, RateInfo } from "@/lib/ff/types";
import { boltz as boltzApi } from "@/lib/boltz";
import { initEccLib, crypto } from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import ECPairFactory from "ecpair";
import { randomBytes } from "crypto";
import {
  getRateFromLightning,
  getAbsoluteRate,
  getRateToLightning,
} from "../actions/rate";
import useFees from "../hooks/fees";
import { getOrder } from "../actions/order-status";

export default function ConfirmScreen() {
  const { update, draftAmount, draftAddress, draftEmail, direction, coin } =
    useAppState();
  const boltz = useBoltz();
  const ff = useFixedFloat();

  const [hideDetails, setHideDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [absoluteRate, setAbsoluteRate] = useState<RateInfo | null>(null);
  const [relativeRate, setRelativeRate] = useState<PriceData | null>(null);

  const { totalFees } = useFees(relativeRate, absoluteRate);

  const coinInfo = currencyStats.find((c) => c.code === coin);
  const toast = useToast();

  if (!draftAmount || !draftAddress)
    throw new Error("Invalid confirmation state");

  const handleConfirm = useCallback(async () => {
    if (!totalFees) return;

    setLoading(true);

    try {
      if (coin === "BTC") {
        if (!boltz) return;

        initEccLib(ecc);
        const keypair = ECPairFactory(ecc).makeRandom();

        if (direction === Direction.FromLightning) {
          const preimage = randomBytes(32);

          const swap = await boltzApi.createReverseSwap({
            invoiceAmount: draftAmount + totalFees,
            to: "BTC",
            from: "BTC",
            claimPublicKey: keypair.publicKey.toString("hex"),
            preimageHash: crypto.sha256(preimage).toString("hex"),
          });

          boltz.setSwap({
            direction,
            swap,
            keypair,
            preimage,
          });
          update({
            screen: AppScreen.FromLnStatus,
          });
        } else {
          const swap = await boltzApi.createSubmarineSwap({
            invoice: draftAddress,
            to: "BTC",
            from: "BTC",
            refundPublicKey: keypair.publicKey.toString("hex"),
          });

          boltz.setSwap({
            direction,
            swap,
            keypair,
          });
          update({
            screen: AppScreen.ToLnStatus,
          });
        }
      } else {
        if (!ff || !absoluteRate || !relativeRate) return;

        if (direction === Direction.FromLightning) {
          const res = await createOrder({
            fromCcy: "BTCLN",
            toCcy: coin,
            amount: Number(relativeRate.from.amount),
            direction: "from",
            type: "fixed",
            toAddress: draftAddress,
          });

          if (!res.success) {
            throw new Error(res.message);
          }

          if (draftEmail) {
            await setOrderEmail({
              id: res.data.id,
              token: res.data.token,
              email: draftEmail,
            });
          }

          const order = await getOrder(res.data.id, res.data.token);

          if (!order.success) throw new Error("Invalid order");

          ff.setOrder({
            token: res.data.token,
            ...order.data,
          });

          update({
            screen: AppScreen.Status,
          });
        } else {
          const input = {
            fromCcy: coin,
            toCcy: "BTCLN",
            amount: draftAmount / 100000000,
            direction: "to",
            type: "fixed",
            toAddress: draftAddress,
          };

          const res = await createOrder(input);

          if (!res.success) {
            throw new Error(res.message);
          }

          if (draftEmail) {
            await setOrderEmail({
              id: res.data.id,
              token: res.data.token,
              email: draftEmail,
            });
          }

          const order = await getOrder(res.data.id, res.data.token);

          if (!order.success) throw new Error("Invalid order");

          ff.setOrder({
            token: res.data.token,
            ...order.data,
          });

          update({
            screen: AppScreen.Status,
          });
        }
      }
    } catch (e) {
      toast.error(e);
    } finally {
      setLoading(false);
    }
  }, [
    boltz,
    coin,
    direction,
    draftAddress,
    draftAmount,
    draftEmail,
    ff,
    absoluteRate,
    relativeRate,
    toast,
    totalFees,
    update,
  ]);

  useEffect(() => {
    async function pollRate() {
      if (coin === "BTC" || !draftAmount) return;

      if (direction === Direction.FromLightning) {
        const fromLightningRate = await getRateFromLightning(
          coin,
          draftAmount / 100000000,
        );
        const rateToCoin = await getAbsoluteRate(coin, "BTCLN");

        setRelativeRate(fromLightningRate);
        setAbsoluteRate(rateToCoin);
      } else {
        const toLightningRate = await getRateToLightning(
          coin,
          draftAmount / 100000000,
        );
        const rateFromCoin = await getAbsoluteRate("BTCLN", coin);

        setRelativeRate(toLightningRate);
        setAbsoluteRate(rateFromCoin);
      }
    }

    let interval: NodeJS.Timeout | null = null;

    if (coin !== "BTC" && draftAmount) {
      pollRate();
      interval = setInterval(pollRate, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [coin, direction, draftAmount]);

  return (
    <Flex col width="full" className="h-screen p-4 pt-2">
      <SwapIndicator onBack={() => update({ screen: AppScreen.Address })} />

      <Flex col grow>
        <Flex grow center col gap={2}>
          <Text variant="h1" weight="medium">
            {draftAmount.toLocaleString()}{" "}
            <span className="text-grey">SATS</span>
          </Text>
        </Flex>

        <Flex col gap={6}>
          {hideDetails ? null : (
            <Flex col gap={4} className="text-darkGrey">
              <Flex gap={4} justify="between" align="center">
                <Text weight="medium">Swap</Text>
                <Flex gap={2} center>
                  {direction === Direction.FromLightning ? (
                    <Text
                      style={{ color: lightningCurrency?.color }}
                      weight="medium"
                    >
                      Lightning
                    </Text>
                  ) : (
                    <Text style={{ color: coinInfo?.color }} weight="medium">
                      {coinInfo?.name}
                    </Text>
                  )}
                  <Icon
                    icon="IconArrowRight"
                    className="w-6 h-6 text-darkGrey"
                  />
                  {direction === Direction.ToLightning ? (
                    <Text
                      style={{ color: lightningCurrency?.color }}
                      weight="medium"
                    >
                      Lightning
                    </Text>
                  ) : (
                    <Text style={{ color: coinInfo?.color }} weight="medium">
                      {coinInfo?.name}
                    </Text>
                  )}
                </Flex>
              </Flex>
              <Divider />
              <Flex gap={4} justify="between" align="center">
                <Text weight="medium">Send to</Text>
                <Flex gap={2} center>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      direction === Direction.FromLightning
                        ? coinInfo?.logo
                        : lightningCurrency?.logo
                    }
                    alt="Logo"
                    width={24}
                    height={24}
                  />
                  <Text weight="medium">
                    {draftAddress.slice(0, 6)}...{draftAddress.slice(-6)}
                  </Text>
                </Flex>
              </Flex>
              <Divider />
              <Flex gap={4} justify="between" align="center">
                <Text weight="medium">Fees</Text>
                <FeeIndicator swapRate={relativeRate} rate={absoluteRate} />
              </Flex>
              <Divider />
            </Flex>
          )}
          <Flex col gap={4}>
            <Button
              variant="offWhite"
              onClick={() => setHideDetails(!hideDetails)}
            >
              {hideDetails ? "Show" : "Hide"} Details & Fee
            </Button>
            <Button
              onClick={handleConfirm}
              loading={loading}
              disabled={coin !== "BTC" && !absoluteRate}
            >
              Confirm Swap
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

function FeeIndicator({
  swapRate,
  rate,
}: {
  swapRate: PriceData | null;
  rate: RateInfo | null;
}) {
  const { coin, direction } = useAppState();
  const { networkFees, providerFees, totalFees } = useFees(swapRate, rate);

  const convertFeeToCoin = useCallback(
    (sats: number) => {
      if (coin !== "BTC" && direction === Direction.ToLightning && rate) {
        const convertedAmount = ((sats / 100000000) * (rate.out ?? 0)).toFixed(
          7,
        );

        return convertedAmount;
      }

      return sats;
    },
    [coin, direction, rate],
  );

  return (
    <Flex gap={2} center>
      <Text>
        {coin !== "BTC" && direction === Direction.ToLightning
          ? convertFeeToCoin(totalFees) + " " + coin
          : totalFees.toLocaleString() + " SATS"}
      </Text>
      <Popover>
        <PopoverTrigger asChild>
          <BoltzInfoButton>
            <Icon
              icon="IconInfoCircle"
              className="w-5 h-5 shrink-0 text-darkGrey"
            />{" "}
          </BoltzInfoButton>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            className="rounded-lg shadow-lg p-4 flex flex-col bg-white border border-extraLightGrey gap-2"
            side="left"
            sideOffset={16}
          >
            <Text>
              Network Fee:{" "}
              {coin !== "BTC" && direction === Direction.ToLightning
                ? convertFeeToCoin(networkFees) + " " + coin
                : networkFees.toLocaleString() + " SATS"}
            </Text>
            {coin === "BTC" ? (
              <Text>Boltz Fee: {providerFees.toLocaleString()} SATS</Text>
            ) : (
              <Text>
                FixedFloat Fee:{" "}
                {direction === Direction.ToLightning
                  ? convertFeeToCoin(providerFees) + " " + coin
                  : providerFees.toLocaleString() + " SATS"}
              </Text>
            )}
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </Flex>
  );
}

const Divider = styled("hr", {
  base: "!border-t border-extraLightGrey",
});

const BoltzInfoButton = styled("button", {
  base: "flex rounded-lg p-2 items-center justify-center active:bg-extraLightGrey transition-colors disabled:pointer-events-none disabled:opacity-50",
});
