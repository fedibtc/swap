import Flex from "@/app/components/flex";
import { Icon, Text } from "@fedibtc/ui";
import { styled } from "react-tailwind-variants";

export function StatusProgressStep({
  status,
  text,
}: {
  status: "idle" | "loading" | "success";
  text: string;
}) {
  return (
    <Flex grow col align="center" noBasis>
      <StatusStep status={status} />
      <Flex gap={1} align="center">
        {status === "idle" ? (
          <Icon icon="IconMinus" className="w-4 h-4 text-grey" />
        ) : status === "loading" ? (
          <Icon icon="IconLoader2" className="w-4 h-4 animate-spin text-grey" />
        ) : (
          <Icon icon="IconCheck" className="w-4 h-4 text-green" />
        )}
        <Text variant="small">{text}</Text>
      </Flex>
    </Flex>
  );
}

const StatusStep = styled("div", {
  base: "grow h-2 w-full rounded-full",
  variants: {
    status: {
      idle: "bg-lightGrey",
      loading: "animate-pulse bg-blue-300",
      success: "bg-blue-500",
    },
  },
});
