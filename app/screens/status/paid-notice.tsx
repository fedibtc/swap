import { useAppState } from "@/app/components/app-state-provider";
import Flex from "@/app/components/flex";
import { Icon, Text } from "@fedibtc/ui";

export function PaidNotice() {
  const { coin } = useAppState();
  return (
    <Flex
      row
      gap={4}
      p={4}
      align="center"
      justify="between"
      className="border border-lightGrey rounded-lg"
    >
      <Text variant="h2" weight="medium">
        Pay {coin} Address
      </Text>
      <Flex center p={1} className="w-8 h-8 rounded-full bg-green">
        <Icon icon="IconCheck" className="w-6 h-6 text-white" />
      </Flex>
    </Flex>
  );
}
