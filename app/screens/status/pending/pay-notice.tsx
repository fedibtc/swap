import {
  AppStateFF,
  Direction,
  useAppState,
} from "@/app/components/app-state-provider";
import { Text, Button, Icon, useFediInjection, useToast } from "@fedibtc/ui";
import QRCode from "react-qr-code";
import { styled } from "react-tailwind-variants";
import { useOrderStatus } from "../status-provider";
import { tokens } from "@/lib/constants";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import Flex from "@/app/components/ui/flex";

export function PayNotice() {
  const { coin, direction } = useAppState<AppStateFF>();
  const { order } = useOrderStatus();
  const { webln } = useFediInjection();
  const toast = useToast();

  let invoice: null | string = null;
  let address = order.from.address;
  let amount = Number(order.from.amount);

  if (direction === Direction.FromLightning) {
    invoice = order.from.address;
  } else {
    let contractAddress = tokens.find((t) => t.code === order.from.code);

    if (!contractAddress) return null;

    invoice = `${contractAddress.network}:${contractAddress.contract_address}/transfer?address=${address}&uint256=${amount * 10 ** 6}`;
  }

  const copyToClipboard = (text: string) => {
    return () => {
      navigator.clipboard.writeText(text).then(() => {
        toast.show("Copied to clipboard");
      });
    };
  };

  const shouldAllowURI = invoice && direction !== Direction.FromLightning;

  return (
    <BorderContainer>
      <Text variant="h2" weight="medium">
        {direction === Direction.FromLightning
          ? "Pay Lightning Invoice"
          : `Pay ${coin} Address`}
      </Text>
      <Tabs defaultValue={shouldAllowURI ? "uri" : "address"}>
        {shouldAllowURI && (
          <TabsList>
            <TabsTrigger value="uri">Payment Request</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
          </TabsList>
        )}
        {shouldAllowURI && (
          <TabsContent value="uri">
            <Flex col gap={2} align="center" className="mt-2">
              <Text className="text-center">
                To complete the exchange, pay the following Payment Request:
              </Text>
              <QRCode value={invoice} size={200} />
              <CopyButton onClick={copyToClipboard(invoice)}>
                <Text
                  className="text-grey grow text-center"
                  variant="caption"
                  ellipsize
                >
                  {invoice}
                </Text>
                <Icon icon="IconCopy" className="w-4 h-4 shrink-0" />
              </CopyButton>
            </Flex>
          </TabsContent>
        )}
        <TabsContent value="address">
          <Flex col gap={2} align="center" className="mt-2">
            {direction === Direction.FromLightning ? (
              <Text className="text-center">
                To complete the exchange, pay the following Lightning Invoice:
              </Text>
            ) : (
              <Text className="text-center">
                To complete the exchange, pay <strong>exactly</strong>{" "}
                <CopyAmount onClick={copyToClipboard(amount.toString())}>
                  <span>{amount}</span>{" "}
                  <Icon icon="IconCopy" className="w-4 h-4 shrink-0" />
                </CopyAmount>{" "}
                {coin} to the following Address:
              </Text>
            )}
            <QRCode value={address} size={200} />
            <CopyButton onClick={copyToClipboard(address)}>
              <Text
                className="text-grey grow text-center"
                variant="caption"
                ellipsize
              >
                {address}
              </Text>
              <Icon icon="IconCopy" className="w-4 h-4 shrink-0" />
            </CopyButton>
            {direction === Direction.FromLightning && (
              <Button
                onClick={() => webln.sendPayment(address).catch(() => {})}
                width="full"
              >
                Pay with Lightning
              </Button>
            )}
          </Flex>
        </TabsContent>
      </Tabs>
    </BorderContainer>
  );
}

const CopyButton = styled("button", {
  base: "flex gap-2 p-2 items-center border border-solid border-lightGrey rounded-lg hover:bg-extraLightGrey transition-colors active:bg-extraLightGrey w-full",
});

const CopyAmount = styled("button", {
  base: "inline-flex underline text-grey gap-1 items-center active:text-black transition-colors",
});

export const BorderContainer = styled("div", {
  base: "flex flex-col items-center gap-4 p-4 border border-lightGrey rounded-lg",
});
