import Flex from "@/app/components/ui/flex";
import { StatusBanner } from "@/app/components/ui/status-banner";
import { Button, Icon, Text, useToast } from "@fedibtc/ui";
import { useOrderStatus } from "../status-provider";
import FormInput from "@/app/components/form-input";
import { AppStateFF, useAppState } from "@/app/components/app-state-provider";
import { useState } from "react";
import { EmergencyStatus, OrderStatus } from "@/lib/ff/types";
import { handleEmergency } from "@/app/actions/handle-emergency";
import { setOrderEmail } from "@/app/actions/set-email";
import { BorderContainer } from "../pending/pay-notice";
import Image from "next/image";

export default function EmergencyStatusComponent() {
  const { coin, exchangeOrder } = useAppState<AppStateFF>();
  const {
    order: { emergency, status, email },
  } = useOrderStatus();
  const toast = useToast();

  const [emergencyEmail, setEmergencyEmail] = useState("");
  const [emergencyAddress, setEmergencyAddress] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [hasRefunded, setHasRefunded] = useState(false);

  const handleRefund = async () => {
    if (!emergencyAddress || !exchangeOrder) return;
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

      if (emergencyEmail) {
        await setOrderEmail({
          id: exchangeOrder.id,
          token: exchangeOrder.token,
          email: emergencyEmail,
        });
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
        {hasRefunded ? (
          <Flex col gap={2}>
            <BorderContainer>
              <Image src="/logo.png" alt="Logo" width={64} height={64} />
              <Text variant="h2" weight="medium">
                Refund Complete
              </Text>
              <Text className="text-center">
                Successfully initiated refund
                {email ||
                  (emergencyEmail &&
                    ". You will receive an email when your order has been refunded.")}
              </Text>
            </BorderContainer>
          </Flex>
        ) : (
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

            <FormInput
              label={`${coin} Address`}
              value={emergencyAddress}
              onChange={(e) => setEmergencyAddress(e.target.value)}
              placeholder={coin === "BTC" ? "bc1..." : "0x..."}
            />

            {!email && status !== OrderStatus.NEW ? (
              <FormInput
                label="Email Address (optional)"
                description="Receive a notification when your order is refunded"
                value={emergencyEmail}
                onChange={(e) => setEmergencyEmail(e.target.value)}
                type="email"
                placeholder="john@doe.com"
              />
            ) : null}
          </Flex>
        )}
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
