import { styled } from "react-tailwind-variants";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export const Tabs = styled(TabsPrimitive.Root, {
  base: "flex flex-col w-full",
});

export const TabsList = styled(TabsPrimitive.List, {
  base: "shrink-0 flex bg-extraLightGrey rounded-lg p-1",
});

export const TabsTrigger = styled(TabsPrimitive.Trigger, {
  base: "grow basis-0 text-center text-caption data-[state='active']:bg-white bg-extraLightGrey px-2 py-1.5 rounded user-select-none cursor-pointer",
});

export const TabsContent = styled(TabsPrimitive.Content, {
  base: "w-full flex flex-col",
});
