"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import * as React from "react";

import { Icon } from "@fedibtc/ui";
import { styled } from "react-tailwind-variants";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ children, ...props }, ref) => (
  <SelectTriggerBase ref={ref} {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <Icon icon="IconChevronDown" className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectTriggerBase>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectTriggerBase = styled(SelectPrimitive.Trigger, {
  base: "flex grow basis-0 gap-1 h-[40px] items-center justify-center rounded-full bg-white px-6 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
});

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectContentBase ref={ref} position={position} {...props}>
      <SelectViewport position={position}>{children}</SelectViewport>
    </SelectContentBase>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectContentBase = styled(SelectPrimitive.Content, {
  base: "relative z-50 overflow-hidden rounded-[16px] border bg-white text-grey",
  variants: {
    position: {
      popper:
        "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      "item-aligned": "",
    },
  },
  defaultVariants: {
    position: "popper",
  },
});

const SelectViewport = styled(SelectPrimitive.Viewport, {
  base: "",
  variants: {
    position: {
      popper:
        "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
      "item-aligned": "",
    },
  },
});

const SelectLabel = styled(SelectPrimitive.Label, {
  base: "py-sm pl-[40px] pr-md text-sm font-semibold",
});

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ children, ...props }, ref) => (
  <SelectItemBase ref={ref} {...props}>
    <span className="absolute left-2 flex h-xl w-xl items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Icon icon="IconCheck" className="h-lg w-lg" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectItemBase>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectItemBase = styled(SelectPrimitive.Item, {
  base: "relative flex w-full cursor-default select-none items-center py-sm pl-[40px] pr-md text-sm outline-none focus:bg-extraLightGrey focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
});

const SelectSeparator = styled(SelectPrimitive.Separator, {
  base: "-mx-sm my-sm h-px bg-grey",
});

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
