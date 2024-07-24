import { Icon, Text } from "@fedibtc/ui";
import { Direction, useAppState } from "./app-state-provider";
import Flex from "./ui/flex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "./ui/select";
import { tokens } from "@/lib/constants";
import { styled } from "react-tailwind-variants";
import { CoinIcon, IndicatorOuter } from "./swap-indicator";

export default function Switcher() {
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
      <SwitchButton />
      <CoinIndicator />
    </Flex>
  );
}

function LightningIndicator() {
  const { currencies, update, direction } = useAppState();

  const lightning = currencies.find((c) => c.code === "BTCLN");

  return (
    <IndicatorOuter
      style={{
        borderColor: lightning?.color,
      }}
      asChild
    >
      <button
        onClick={() =>
          update({
            direction:
              direction === Direction.ToLightning
                ? Direction.FromLightning
                : Direction.ToLightning,
          })
        }
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
      </button>
    </IndicatorOuter>
  );
}

function SwitchButton() {
  const { direction, update } = useAppState();

  return (
    <CoinSwitchButton
      onClick={() =>
        update({
          direction:
            direction === Direction.ToLightning
              ? Direction.FromLightning
              : Direction.ToLightning,
        })
      }
    >
      <Icon icon="IconSwitchHorizontal" className="h-4 w-4 shrink-0" />
    </CoinSwitchButton>
  );
}

function CoinIndicator() {
  const { coin, update, currencies } = useAppState();

  const currentCurrency = currencies.find((c) => c.code === coin);

  return (
    <Select value={coin} onValueChange={(coin) => update({ coin: coin })}>
      <CoinSelector
        style={{
          borderColor: coin === "ETH" ? "black" : currentCurrency?.color,
        }}
      >
        <SelectValue placeholder="Select coin" />
      </CoinSelector>
      <SelectContent>
        {tokens
          .filter((token) => currencies.find((c) => c.code === token.code))
          .map((token) => (
            <SelectItem key={token.code} value={token.code}>
              <Flex row gap={2} align="center">
                <CoinIcon
                  src={currencies.find((c) => c.code === token.code)?.logo}
                  alt="Icon"
                  style={{
                    borderColor: currencies.find((c) => c.code === token.code)
                      ?.color,
                  }}
                />
                <Text className="grow whitespace-nowrap" variant="caption">
                  {token.code}
                </Text>
              </Flex>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

const CoinSelector = styled(SelectTrigger, {
  base: "border-2 rounded-lg basis-0 grow w-full disabled:pointer-events-none disabled:opacity-50",
});

const CoinSwitchButton = styled("button", {
  base: "flex rounded-lg p-2 items-center justify-center active:bg-extraLightGrey transition-colors disabled:pointer-events-none disabled:opacity-50",
});
