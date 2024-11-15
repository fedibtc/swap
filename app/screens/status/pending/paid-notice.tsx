import {
  Direction,
  useAppState,
} from "@/app/components/providers/app-state-provider";
import Flex from "@/app/components/ui/flex";
import { Icon, Text } from "@fedibtc/ui";
import { BorderContainer } from "./pay-notice";

export function PaidNotice() {
  const { coin, direction } = useAppState();
  return (
    <BorderContainer>
      <Text variant="h2" weight="medium">
        {direction === Direction.FromLightning
          ? "Pay Lightning Invoice"
          : `Pay ${coin} Address`}
      </Text>
      <Flex center p={1} className="w-8 h-8 rounded-full bg-green">
        <Icon icon="IconCheck" className="w-6 h-6 text-white" />
      </Flex>
    </BorderContainer>
  );
}
