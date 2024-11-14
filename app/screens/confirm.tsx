import { styled } from "react-tailwind-variants";
import {
  AppScreen,
  Direction,
  useAppState,
} from "../components/providers/app-state-provider";
import CoinHeader from "../components/coin-header";
import Flex from "../components/ui/flex";
import { Button, Text, Icon, useToast } from "@fedibtc/ui";
import { currencyStats } from "@/lib/constants";
import { useEffect, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { createOrder } from "../actions/create-order";
import { setOrderEmail } from "../actions/set-email";
import { useAmount } from "../hooks/amount";
import { useBoltz } from "../components/providers/boltz-provider";
import { useFixedFloat } from "../components/providers/ff-provider";
import { PriceData } from "@/lib/ff/types";
import { getRateFromLightning, getRateToLightning } from "../actions/get-rate";
import { boltz as boltzApi } from "@/lib/boltz";
import { initEccLib, crypto } from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import ECPairFactory from "ecpair";
import { randomBytes } from "crypto";

export default function ConfirmScreen() {
  const { update, draftAmount, draftAddress, draftEmail, direction, coin } =
    useAppState();
  const boltz = useBoltz();
  const ff = useFixedFloat();
  const { inputAmount, swapFees } = useAmount();
  const [hideDetails, setHideDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState<PriceData | null>(null);

  const lightning = currencyStats.find((c) => c.code === "LN");
  const coinInfo = currencyStats.find((c) => c.code === coin);
  const toast = useToast();

  const handleConfirm = async () => {
    if (!draftAmount || !draftAddress) return;

    setLoading(true);

    try {
      if (coin === "BTC") {
        if (!boltz) return;

        if (direction === Direction.FromLightning) {
          initEccLib(ecc);

          const keypair = ECPairFactory(ecc).makeRandom();
          const preimage = randomBytes(32);

          const swap = await boltzApi.createReverseSwap({
            invoiceAmount: inputAmount,
            to: "BTC",
            from: "BTC",
            claimPublicKey: keypair.publicKey.toString("hex"),
            preimageHash: crypto.sha256(preimage).toString("hex"),
          });

          boltz.setSwap({
            direction,
            swap,
            keypair,
            preimage
          });
          update({
            screen: AppScreen.FromLnStatus,
          });
        } else {
          initEccLib(ecc);

          const keypair = ECPairFactory(ecc).makeRandom();

          const swap = await boltzApi.createSubmarineSwap({
            invoice: draftAddress,
            to: "BTC",
            from: "BTC",
            refundPublicKey: keypair.publicKey.toString("hex"),
          });

          boltz.setSwap({
            direction,
            swap,
            keypair
          });
          update({
            screen: AppScreen.ToLnStatus,
          });
        }
      } else {
        if (!ff || !rate) return;

        if (direction === Direction.FromLightning) {
          const res = await createOrder({
            fromCcy: "BTCLN",
            toCcy: coin,
            amount: Number(rate.from.amount),
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

          ff.setSwap({
            id: res.data.id,
            token: res.data.token,
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

          ff.setSwap({
            id: res.data.id,
            token: res.data.token,
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
  };

  useEffect(() => {
    async function loadRate() {
      if (coin === "BTC" || !draftAmount) {
        setRate(null);

        return;
      }

      if (direction === Direction.FromLightning) {
        setRate(await getRateFromLightning(coin, draftAmount / 100000000));
      } else {
        setRate(await getRateToLightning(coin, draftAmount / 100000000));
      }
    }

    loadRate();
  }, [coin, direction, draftAmount]);

  useEffect(() => {
    console.log(rate, "CRATE");
  }, [rate]);

  if (!draftAmount || !draftAddress) return null;

  return (
    <Flex col width="full" className="h-screen p-4 pt-2">
      <CoinHeader onBack={() => update({ screen: AppScreen.Address })} />

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
                    <Text style={{ color: lightning?.color }} weight="medium">
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
                    <Text style={{ color: lightning?.color }} weight="medium">
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
                  <img src={direction === Direction.FromLightning ? coinInfo?.logo : lightning?.logo} alt="Logo" width={24} height={24} />
                  <Text weight="medium">
                    {draftAddress.slice(0, 6)}...{draftAddress.slice(-6)}
                  </Text>
                </Flex>
              </Flex>
              <Divider />
              <Flex gap={4} justify="between" align="center">
                <Text weight="medium">Fees</Text>
                <Flex gap={2} center>
                  <Text>
                    {coin === "BTC"
                      ? swapFees.toLocaleString()
                      : +(Number(rate?.from.btc as string) * 100000000).toFixed(
                        7
                      ) - draftAmount}{" "}
                    SATS
                  </Text>
                  <BoltzFeesIndicator rate={rate} />
                </Flex>
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
              disabled={coin !== "BTC" && !rate}
            >
              Confirm Swap
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

function BoltzFeesIndicator({ rate }: { rate: PriceData | null }) {
  const { networkFees, swapFees } = useAmount();
  const { coin, direction, draftAmount } = useAppState();

  const ffInputAmount = useMemo(() => {
    if (coin === "BTC" || !rate) return 0;

    if (direction === Direction.FromLightning) {
      return +(rate.from.amount as string) * 100000000;
    } else {
      return +(rate.from.btc as string) * 100000000;
    }
  }, [rate, direction, coin]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <BoltzInfoButton>
          <Icon
            icon="IconInfoCircle"
            className="w-5 h-5 shrink-0 text-darkGrey"
          />
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
            {coin === "BTC"
              ? networkFees.toLocaleString()
              : Math.floor(ffInputAmount - (draftAmount as number) - ffInputAmount * 0.01)}{" "}
            SATS
          </Text>
          {coin === "BTC" ? (
            <Text>
              Boltz Fee: {(swapFees - networkFees).toLocaleString()} SATS
            </Text>
          ) : (
            <Text>FixedFloat Fee: {Math.ceil(ffInputAmount * 0.01)} SATS</Text>
          )}
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}

const Divider = styled("hr", {
  base: "!border-t border-extraLightGrey",
});

const BoltzInfoButton = styled("button", {
  base: "flex rounded-lg p-2 items-center justify-center active:bg-extraLightGrey transition-colors disabled:pointer-events-none disabled:opacity-50",
});
