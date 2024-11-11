import { Icon, Text } from "@fedibtc/ui";
import Flex from "./ui/flex";
import { useCallback, useState } from "react";
import { currencyStats } from "@/lib/constants";
import * as Popover from "@radix-ui/react-popover";
import { styled } from "react-tailwind-variants";
import { Direction, useAppState } from "./app-state-provider";

export default function Selector() {
  const { update } = useAppState();

  const [fromOption, setFromOption] = useState("LN");
  const [toOption, setToOption] = useState("BTC");
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const fromCurrency = currencyStats.find((c) => c.code === fromOption);
  const toCurrency = currencyStats.find((c) => c.code === toOption);

  const handleFromChange = useCallback(
    (value: string) => {
      setFromOpen(false);

      let toOp = toOption;

      if (value !== "LN") toOp = "LN";

      if (value === "LN" && toOption === "LN")
        toOp = fromOption === "LN" ? "BTC" : fromOption;

      if (toOp !== toOption) setToOption(toOp);
      setFromOption(value);
      update({
        direction:
          value === "LN" ? Direction.FromLightning : Direction.ToLightning,
        coin: value === "LN" ? toOp : value,
      });
    },
    [fromOption, toOption, update]
  );

  const handleToChange = useCallback(
    (value: string) => {
      setToOpen(false);

      let fromOp = fromOption;

      if (value !== "LN") fromOp = "LN";

      if (value === "LN" && fromOption === "LN")
        fromOp = toOption === "LN" ? "BTC" : toOption;

      if (fromOp !== fromOption) setFromOption(fromOp);
      setToOption(value);
      update({
        direction:
          value === "LN" ? Direction.ToLightning : Direction.FromLightning,
        coin: value === "LN" ? fromOp : value,
      });
    },
    [fromOption, toOption, update]
  );

  return (
    <Flex row justify="between" align="center" className="gap-3">
      <Popover.Root open={fromOpen} onOpenChange={setFromOpen}>
        <SelectionTrigger
          style={{
            background: fromCurrency?.background,
            outlineColor: fromCurrency?.color,
          }}
        >
          <Flex row gap={2} align="center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fromCurrency?.logo} alt="Icon" className="w-6 h-6" />
            <Text className="whitespace-nowrap overflow-hidden" weight="medium">
              {fromCurrency?.name}
            </Text>
            <Icon icon="IconChevronDown" className="h-4 w-4 opacity-50" />
          </Flex>
        </SelectionTrigger>
        <Popover.Portal>
          <SelectionContent sideOffset={2} align="start">
            {currencyStats.map((token) => (
              <SelectionItem
                key={token.code}
                value={token.code}
                onClick={() => handleFromChange(token.code)}
                selected={fromOption === token.code}
              >
                <Flex row gap={2} align="center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={token.logo} alt="Icon" className="w-6 h-6" />
                  <Text
                    className="whitespace-nowrap overflow-hidden"
                    weight="medium"
                  >
                    {token.name}
                  </Text>
                  {fromOption === token.code && (
                    <Icon
                      icon="IconCheck"
                      className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2"
                    />
                  )}
                </Flex>
              </SelectionItem>
            ))}
          </SelectionContent>
        </Popover.Portal>
      </Popover.Root>

      <Icon icon="IconArrowRight" className="h-4 w-4" />

      <Popover.Root open={toOpen} onOpenChange={setToOpen}>
        <SelectionTrigger
          style={{
            background: toCurrency?.background,
            outlineColor: toCurrency?.color,
          }}
        >
          <Flex row gap={2} align="center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={toCurrency?.logo} alt="Icon" className="w-6 h-6" />
            <Text className="whitespace-nowrap overflow-hidden" weight="medium">
              {toCurrency?.name}
            </Text>
            <Icon icon="IconChevronDown" className="h-4 w-4 opacity-50" />
          </Flex>
        </SelectionTrigger>
        <Popover.Portal>
          <SelectionContent sideOffset={2} align="end">
            {currencyStats.map((token) => (
              <SelectionItem
                key={token.code}
                value={token.code}
                onClick={() => handleToChange(token.code)}
                selected={toOption === token.code}
              >
                <Flex row gap={2} align="center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={token.logo} alt="Icon" className="w-6 h-6" />
                  <Text
                    className="whitespace-nowrap overflow-hidden"
                    weight="medium"
                  >
                    {token.name}
                  </Text>
                  {toOption === token.code && (
                    <Icon
                      icon="IconCheck"
                      className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2"
                    />
                  )}
                </Flex>
              </SelectionItem>
            ))}
          </SelectionContent>
        </Popover.Portal>
      </Popover.Root>
    </Flex>
  );
}

const SelectionTrigger = styled(Popover.Trigger, {
  base: "flex grow basis-0 gap-1 h-[48px] items-center justify-center rounded-full bg-white px-6 text-sm disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:outline data-[state=open]:outline-offset-0",
});

const SelectionItem = styled("button", {
  base: "relative flex cursor-default select-none items-center p-4 py-2 pr-10 text-sm outline-none hover:bg-extraLightGrey focus:text-accent-foreground w-full first:py-3 last:py-3",
  variants: {
    selected: {
      true: "text-black",
    },
  },
});

const SelectionContent = styled(Popover.Content, {
  base: "rounded-[24px] bg-white text-grey overflow-hidden shadow-2xl w-[var(--radix-popover-trigger-width)]",
});
