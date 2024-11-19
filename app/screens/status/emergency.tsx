import Flex from "@/app/components/ui/flex";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Button, Icon, Text, useToast, Input } from "@fedibtc/ui";
import { useAppState } from "@/app/components/providers/app-state-provider";
import { useCallback, useState } from "react";
import { EmergencyStatus } from "@/lib/ff/types";
import { handleEmergency } from "@/app/actions/handle-emergency";
import { useFixedFloat } from "@/app/components/providers/ff-provider";

export default function EmergencyStatusComponent() {
  const { coin } = useAppState();
  const ff = useFixedFloat();
  const toast = useToast();

  const [emergencyAddress, setEmergencyAddress] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [hasRefunded, setHasRefunded] = useState(false);

  if (!ff || !ff.order) throw new Error("Invalid FixedFloat state");

  const { order } = ff;
  const { emergency } = order;

  const handleRefund = useCallback(async () => {
    setIsRefunding(true);

    try {
      const res = await handleEmergency({
        id: order.id,
        token: order.token,
        choice: "REFUND",
        address: emergencyAddress,
      });

      if (!res.success) {
        throw new Error(res.message);
      }

      setHasRefunded(true);
    } catch (e) {
      toast.error(e);
    } finally {
      setIsRefunding(false);
    }
  }, [emergencyAddress, order, toast]);

  return (
    <Flex grow col width="full">
      <Flex grow col gap={4}>
        <Flex col gap={2}>
          <StatusBanner status="error">
            <Icon icon="IconInfoTriangle" className="w-6 h-6" />
            <Text>
              {emergency.status.includes(EmergencyStatus.LIMIT)
                ? emergency.status.includes(EmergencyStatus.LESS)
                  ? "Amount paid is below minimum"
                  : "Amount paid exceeds maximum"
                : emergency.status.includes(EmergencyStatus.LESS)
                  ? "Amount paid less than expected"
                  : emergency.status.includes(EmergencyStatus.MORE)
                    ? "Amount paid more than expected"
                    : "Payment expired"}
            </Text>
          </StatusBanner>

          <Text>
            The exchange couldn&apos;t be processed. Please enter your {coin}{" "}
            address so that any funds sent to the generated address can be
            refunded.
          </Text>

          <Input
            label={`${coin} Address`}
            value={emergencyAddress}
            onChange={(e) => setEmergencyAddress(e.target.value)}
            placeholder={coin === "BTC" ? "bc1..." : "0x..."}
          />
        </Flex>
      </Flex>
      {hasRefunded ? (
        <Button onClick={() => window.location.reload()}>Done</Button>
      ) : (
        <Button
          onClick={handleRefund}
          loading={isRefunding}
          disabled={!emergencyAddress}
        >
          Submit
        </Button>
      )}
    </Flex>
  );
}
