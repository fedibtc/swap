"use client";

import {
  AppScreen,
  Direction,
  useAppState,
} from "@/app/components/app-state-provider";
import Flex from "@/app/components/flex";
import SwapIndicator from "@/app/components/swap-indicator";
import { Emergency, EmergencyStatus, OrderStatus } from "@/lib/ff/types";
import { Button, Icon, Text, useFediInjection, useToast } from "@fedibtc/ui";
import { useEffect, useState } from "react";
import { styled } from "react-tailwind-variants";
import { PayNotice } from "./pay-notice";
import { PaidNotice } from "./paid-notice";
import { StatusProgressStep } from "./status-step";
import FormInput from "@/app/components/form-input";
import { handleEmergency } from "@/app/actions/handle-emergency";
import { setOrderEmail } from "@/app/actions/set-email";
import Container from "@/app/components/container";
import { getOrder } from "@/app/actions/order-status";

const statusSteps = [
  OrderStatus.NEW,
  OrderStatus.PENDING,
  OrderStatus.EXCHANGE,
  OrderStatus.DONE,
];

export default function Status() {
  const { orderStatus, exchangeOrder, update, direction, coin } = useAppState();
  const { webln } = useFediInjection();
  const toast = useToast();

  const [emergency, setEmergency] = useState<null | Emergency>(null);
  const [emergencyEmail, setEmergencyEmail] = useState("");
  const [emergencyAddress, setEmergencyAddress] = useState("");
  const [hasSetEmail, setHasSetEmail] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

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

      update({
        orderStatus: OrderStatus.DONE,
        screen: AppScreen.Complete,
      });
    } catch (e) {
      toast.error(e);
    } finally {
      setIsRefunding(false);
      update({ screen: AppScreen.Complete });
    }
  };

  // Check status every second
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!exchangeOrder) return;

      const order = await getOrder(exchangeOrder.id, exchangeOrder.token);

      if (order.success) {
        if (Boolean(order.data.email) !== hasSetEmail) {
          setHasSetEmail(Boolean(order.data.email));
        }

        if (order.data.status === OrderStatus.EMERGENCY) {
          setEmergency(order.data.emergency);
        } else if (order.data.status === OrderStatus.EXPIRED) {
          setIsExpired(true);
        } else if (order.data.status === OrderStatus.DONE) {
          update({
            orderStatus: order.data.status,
            screen: AppScreen.Complete,
          });
        } else {
          update({ orderStatus: order.data.status });
        }
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [exchangeOrder, update, hasSetEmail]);

  const determineStepStatus = (step: OrderStatus) => {
    if (orderStatus === step || !orderStatus) {
      return "loading";
    } else if (statusSteps.indexOf(orderStatus) > statusSteps.indexOf(step)) {
      return "success";
    } else {
      return "idle";
    }
  };

  useEffect(() => {
    if (exchangeOrder?.payAddress && direction === Direction.FromLightning) {
      webln.sendPayment(exchangeOrder.payAddress).catch(() => {});
    }
  }, [exchangeOrder?.payAddress, webln, direction]);

  return (
    <Container>
      <Flex col grow width="full" gap={2} p={4}>
        <Flex col grow gap={4}>
          <SwapIndicator />

          {emergency ? (
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
                The exchange couldn&apos;t be processed. Please enter your{" "}
                {coin} address so that any funds sent to the generated address
                can be refunded.
              </Text>

              <FormInput
                label={`${coin} Address`}
                value={emergencyAddress}
                onChange={(e) => setEmergencyAddress(e.target.value)}
                placeholder={coin === "BTC" ? "bc1..." : "0x..."}
              />

              {!hasSetEmail && orderStatus !== OrderStatus.NEW ? (
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
          ) : isExpired ? (
            <Flex col gap={2}>
              <StatusBanner status="error">
                <Icon icon="IconInfoTriangle" className="w-6 h-6" />
                <Text>Payment expired</Text>
              </StatusBanner>
              <Text>A payment was not received within the time limit.</Text>
            </Flex>
          ) : (
            <>
              <Flex row align="center" gap={1}>
                <StatusProgressStep
                  status={determineStepStatus(OrderStatus.NEW)}
                  text="Deposit"
                />
                <StatusProgressStep
                  status={determineStepStatus(OrderStatus.PENDING)}
                  text="Confirmation"
                />
                <StatusProgressStep
                  status={determineStepStatus(OrderStatus.EXCHANGE)}
                  text="Exchange"
                />
                <StatusProgressStep
                  status={determineStepStatus(OrderStatus.DONE)}
                  text="Done"
                />
              </Flex>
              {orderStatus === OrderStatus.NEW ? <PayNotice /> : <PaidNotice />}
            </>
          )}
        </Flex>
        <Flex col gap={2}>
          {emergency ? (
            <Button
              onClick={handleRefund}
              loading={isRefunding}
              disabled={!emergencyAddress}
            >
              Submit
            </Button>
          ) : isExpired ? (
            <Button onClick={() => window.location.reload()}>Restart</Button>
          ) : (
            <StatusBanner status="warning">
              <Icon icon="IconInfoTriangle" className="w-6 h-6" />
              <Text>Warning: Do not close this page</Text>
            </StatusBanner>
          )}
        </Flex>
      </Flex>
    </Container>
  );
}

export const StatusBanner = styled("div", {
  base: "flex gap-2 items-center p-4 rounded-lg border-2",
  variants: {
    status: {
      warning: "bg-yellow-100 text-yellow-600 border-yellow-400",
      error: "bg-red-100 text-red-600 border-red-400",
    },
  },
});
