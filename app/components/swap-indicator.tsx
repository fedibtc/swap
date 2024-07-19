import { Icon, Text } from "@fedibtc/ui";
import { Direction, useAppState } from "./app-state-provider";
import Flex from "./ui/flex";
import { styled } from "react-tailwind-variants";

export default function SwapIndicator() {
  const { direction } = useAppState();

  return (
    <Flex
      row
      gap={2}
      align="center"
      width="full"
      style={{
        flexDirection:
          direction === Direction.FromLightning ? "row" : "row-reverse",
      }}
    >
      <LightningIndicator />
      <SwitchIcon>
        <Icon icon="IconSwitchHorizontal" className="h-4 w-4 shrink-0" />
      </SwitchIcon>
      <CoinIndicator />
    </Flex>
  );
}

function LightningIndicator() {
  const { currencies, isRateLoading } = useAppState();

  const lightning = currencies.find((c) => c.code === "BTCLN");

  return (
    <IndicatorOuter
      loading={isRateLoading}
      style={{
        borderColor: lightning?.color,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <CoinIcon
        src={lightning?.logo}
        alt="Icon"
        style={{
          borderColor: lightning?.color,
        }}
      />
      <Text variant="caption">Lightning ⚡</Text>
    </IndicatorOuter>
  );
}

function CoinIndicator() {
  const { currencies, isRateLoading, coin } = useAppState();

  const currentCoin = currencies.find((c) => c.code === coin);

  return (
    <IndicatorOuter
      loading={isRateLoading}
      style={{
        borderColor: coin === "ETH" ? "black" : currentCoin?.color,
      }}
    >
      <CoinIcon
        src={currentCoin?.logo}
        alt="Icon"
        style={{
          borderColor: currentCoin?.color,
        }}
      />
      <Text variant="caption">{currentCoin?.name}</Text>
    </IndicatorOuter>
  );
}

export const IndicatorOuter = styled(Flex, {
  base: "flex grow basis-0 width-full gap-2 align-center p-2 rounded-lg border-2 border-solid px-md py-sm disabled:pointer-events-none",
  variants: {
    loading: {
      true: "opacity-50",
      false: "opacity-100",
    },
  },
});

export const CoinIcon = styled("img", {
  base: "h-4 w-4 rounded-full border-2",
});

const SwitchIcon = styled("div", {
  base: "flex rounded-lg p-2 items-center justify-center transition-colors disabled:pointer-events-none",
});
