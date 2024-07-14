import { Icon, Text } from "@fedibtc/ui";
import { Direction, useAppState } from "./app-state-provider";
import Flex from "./flex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { tokens } from "@/lib/constants";

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
          direction === Direction.FromLighting ? "row" : "row-reverse",
      }}
    >
      <LightningIndicator />
      <SwitchButton />
      <AltcoinIndicator />
    </Flex>
  );
}

function LightningIndicator() {
  const { currencies } = useAppState();

  const lightning = currencies.find((c) => c.code === "BTCLN");

  return (
    <Flex
      grow
      noBasis
      width="full"
      gap={2}
      align="center"
      p={2}
      className="rounded-lg border-2 px-md py-sm"
      style={{
        borderColor: lightning?.color,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={lightning?.logo}
        className="h-4 w-4 rounded-full border-2"
        alt="Icon"
        style={{
          borderColor: lightning?.color,
        }}
      />
      <Text variant="caption">Lightning ⚡</Text>
    </Flex>
  );
}

function SwitchButton() {
  const { direction, update } = useAppState();

  return (
    <button
      className="flex rounded-lg p-2 items-center justify-center active:bg-extraLightGrey transition-colors"
      onClick={() =>
        update({
          direction:
            direction === Direction.ToLighting
              ? Direction.FromLighting
              : Direction.ToLighting,
        })
      }
    >
      <Icon icon="IconSwitchHorizontal" className="h-4 w-4 shrink-0" />
    </button>
  );
}

function AltcoinIndicator() {
  const { altcoin, update, currencies } = useAppState();

  const currentCurrency = currencies.find((c) => c.code === altcoin);

  return (
    <Select value={altcoin} onValueChange={(coin) => update({ altcoin: coin })}>
      <SelectTrigger
        className="border-2 rounded-lg basis-0 grow w-full"
        style={{ borderColor: currentCurrency?.color }}
      >
        <SelectValue placeholder="Select coin" />
      </SelectTrigger>
      <SelectContent>
        {tokens
          .filter((token) => currencies.find((c) => c.code === token.code))
          .map((token) => (
            <SelectItem key={token.code} value={token.code}>
              <Flex row gap={2} align="center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currencies.find((c) => c.code === token.code)?.logo}
                  className="h-4 w-4 rounded-full border-2"
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
