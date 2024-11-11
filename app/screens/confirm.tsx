import { styled } from "react-tailwind-variants";
import {
  AppScreen,
  Direction,
  useAppState,
} from "../components/app-state-provider";
import CoinHeader from "../components/coin-header";
import Flex from "../components/ui/flex";
import { Button, Text, Icon, useToast } from "@fedibtc/ui";
import { currencyStats } from "@/lib/constants";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { createOrder } from "../actions/create-order";
import { setOrderEmail } from "../actions/set-email";
import { getRate } from "../actions/get-rate";
import { useAmount } from "../hooks/amount";

export default function ConfirmScreen() {
  const {
    update,
    draftAmount,
    draftAddress,
    draftEmail,
    direction,
    coin,
    boltzToLnRate,
    boltzFromLnRate,
  } = useAppState();
  const { inputAmount, swapFees } = useAmount();
  const [hideDetails, setHideDetails] = useState(false);

  const lightning = currencyStats.find((c) => c.code === "LN");
  const coinInfo = currencyStats.find((c) => c.code === coin);
  const toast = useToast();

  const handleConfirm = async () => {
    if (!draftAmount || !draftAddress) return;

    try {
      if (coin === "BTC") {
        if (!boltzFromLnRate || !boltzToLnRate) return;

        if (direction === Direction.FromLightning) {
          update({
            exchangeOrder: {
              amount: inputAmount,
              address: draftAddress,
            },
            screen: AppScreen.FromLnStatus,
          });
        } else {
          update({
            exchangeOrder: {
              amount: inputAmount,
              invoice: draftAddress,
            },
            screen: AppScreen.ToLnStatus,
          });
        }
      } else {
        if (direction === Direction.FromLightning) {
          let correctedAmount = inputAmount / 100000000;

          const res = await createOrder({
            fromCcy: "BTCLN",
            toCcy: coin,
            // 1% fixed fee
            amount: correctedAmount / 0.99,
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

          update({
            exchangeOrder: {
              id: res.data.id,
              token: res.data.token,
            },
            screen: AppScreen.Status,
          });
        } else {
          const rate = await getRate(coin, "BTCLN");
          const btc = +(inputAmount * Number(rate.from.rate)).toFixed(7);

          const input = {
            fromCcy: coin,
            toCcy: "BTCLN",
            // 1% fixed fee
            amount: +btc.toFixed(8) / 0.99,
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

          update({
            exchangeOrder: {
              id: res.data.id,
              token: res.data.token,
            },
            screen: AppScreen.Status,
          });
        }
      }
    } catch (e) {
      toast.error(e);
    }
  };

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
                  <img src={coinInfo?.logo} alt="Logo" width={24} height={24} />
                  <Text weight="medium">
                    {draftAddress.slice(0, 6)}...{draftAddress.slice(-6)}
                  </Text>
                </Flex>
              </Flex>
              <Divider />
              <Flex gap={4} justify="between" align="center">
                <Text weight="medium">Fees</Text>
                <Flex gap={2} center>
                  <Text>{swapFees.toLocaleString()} SATS</Text>
                  <BoltzFeesIndicator />
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
            <Button onClick={handleConfirm}>Confirm Swap</Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

function BoltzFeesIndicator() {
  const { networkFees, swapFees } = useAmount();

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
          <Text>Network Fee: {networkFees.toLocaleString()} SATS</Text>
          <Text>
            Boltz Fee: {(swapFees - networkFees).toLocaleString()} SATS
          </Text>
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
