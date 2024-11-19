import Flex from "@/app/components/ui/flex";
import { ProgressStep } from "./step";
import { OrderStatus } from "@/lib/ff/types";
import { PayNotice } from "./pay-notice";
import { PaidNotice } from "./paid-notice";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Icon, Text } from "@fedibtc/ui";
import { useFixedFloat } from "@/app/components/providers/ff-provider";
import { useCallback } from "react";

const statusSteps = [
  OrderStatus.NEW,
  OrderStatus.PENDING,
  OrderStatus.EXCHANGE,
  OrderStatus.DONE,
];

export default function ExpiredStatus() {
  const ff = useFixedFloat();

  if (!ff || !ff.order) throw new Error("Invalid FixedFloat state");

  const { order } = ff;

  const determineStepStatus = useCallback(
    (step: OrderStatus) => {
      if (order.status === step) {
        return "loading";
      } else if (
        statusSteps.indexOf(order.status) > statusSteps.indexOf(step)
      ) {
        return "success";
      } else {
        return "idle";
      }
    },
    [order.status],
  );

  return (
    <Flex grow col width="full">
      <Flex grow col gap={4}>
        <Flex row align="center" gap={1}>
          <ProgressStep
            status={determineStepStatus(OrderStatus.NEW)}
            text="Deposit"
          />
          <ProgressStep
            status={determineStepStatus(OrderStatus.PENDING)}
            text="Confirmation"
          />
          <ProgressStep
            status={determineStepStatus(OrderStatus.EXCHANGE)}
            text="Exchange"
          />
          <ProgressStep
            status={determineStepStatus(OrderStatus.DONE)}
            text="Done"
          />
        </Flex>
        {order.status === OrderStatus.NEW ? <PayNotice /> : <PaidNotice />}
      </Flex>
      <StatusBanner status="warning">
        <Icon icon="IconInfoTriangle" className="w-6 h-6" />
        <Text>Warning: Do not close this page</Text>
      </StatusBanner>
    </Flex>
  );
}
