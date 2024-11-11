import Flex from "@/app/components/ui/flex";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Button, Icon, Text, useToast, Input } from "@fedibtc/ui";
import { useOrderStatus } from "../status-provider";
import { AppStateFF, useAppState } from "@/app/components/app-state-provider";
import { useState } from "react";
import { EmergencyStatus } from "@/lib/ff/types";
import { handleEmergency } from "@/app/actions/handle-emergency";

export default function EmergencyStatusComponent() {
  const { coin, exchangeOrder } = useAppState<AppStateFF>();
  const {
    order: { emergency},
  } = useOrderStatus();
  const toast = useToast();

  const [emergencyAddress, setEmergencyAddress] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [hasRefunded, setHasRefunded] = useState(false);

  const handleRefund = async () => {
    if (!exchangeOrder) return;
    setIsRefunding(true);
    try {
      const res = await handleEmergency({
        id: exchangeOrder.id,
        token: exchangeOrder.token,
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
  };

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
