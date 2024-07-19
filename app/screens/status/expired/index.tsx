import Flex from "@/app/components/ui/flex";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Button, Icon, Text } from "@fedibtc/ui";

export default function ExpiredStatus() {
  return (
    <Flex grow col width="full">
      <Flex grow col gap={4}>
        <Flex col gap={2}>
          <StatusBanner status="error">
            <Icon icon="IconInfoTriangle" className="w-6 h-6" />
            <Text>Payment expired</Text>
          </StatusBanner>
          <Text>A payment was not received within the time limit.</Text>
        </Flex>
      </Flex>
      <Button onClick={() => window.location.reload()}>Restart</Button>
    </Flex>
  );
}
