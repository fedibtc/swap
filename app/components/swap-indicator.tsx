import { Icon, Text } from "@fedibtc/ui";
import Flex from "./ui/flex";
import { currencyStats, lightningCurrency } from "@/lib/constants";
import { styled } from "react-tailwind-variants";
import { Direction, useAppState } from "./providers/app-state-provider";

export default function SwapIndicator({ onBack }: { onBack?: () => void }) {
  const { coin, direction } = useAppState();

  const coinCurrency = currencyStats.find((c) => c.code === coin);

  let fromCurrency =
    direction === Direction.FromLightning ? lightningCurrency : coinCurrency;
  let toCurrency =
    direction === Direction.ToLightning ? lightningCurrency : coinCurrency;

  return (
    <Flex col gap={2} width="full">
      {onBack && (
        <Flex row className="h-4 overflow-hidden">
          <Flex
            row
            gap={2}
            align="end"
            className="text-grey border-solid border-0 border-b border-grey hover:border-darkGrey hover:text-darkGrey cursor-pointer"
            asChild
          >
            <button onClick={onBack}>
              <Icon icon="IconArrowLeft" className="h-4 w-4" />
              <Text variant="caption">Back</Text>
            </button>
          </Flex>
        </Flex>
      )}
      <Flex row justify="between" align="center" className="gap-3">
        <CoinItem
          style={{
            outlineColor: fromCurrency?.color,
          }}
        >
          <Flex row gap={2} align="center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fromCurrency?.logo} alt="Icon" className="w-6 h-6" />
            <Text className="whitespace-nowrap overflow-hidden" weight="medium">
              {fromCurrency?.name}
            </Text>
          </Flex>
        </CoinItem>

        <Icon icon="IconArrowRight" className="h-4 w-4" />

        <CoinItem
          style={{
            outlineColor: toCurrency?.color,
          }}
        >
          <Flex row gap={2} align="center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={toCurrency?.logo} alt="Icon" className="w-6 h-6" />
            <Text className="whitespace-nowrap overflow-hidden" weight="medium">
              {toCurrency?.name}
            </Text>
          </Flex>
        </CoinItem>
      </Flex>
    </Flex>
  );
}

const CoinItem = styled("div", {
  base: "flex grow basis-0 gap-1 h-[48px] items-center justify-center rounded-full bg-offWhite px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:outline data-[state=open]:outline-offset-0",
});
