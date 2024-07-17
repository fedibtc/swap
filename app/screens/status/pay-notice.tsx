import { Direction, useAppState } from "@/app/components/app-state-provider";
import Flex from "@/app/components/flex";
import { Text, Button, Icon, useFediInjection, useToast } from "@fedibtc/ui";
import QRCode from "react-qr-code";

export function PayNotice() {
  const { coin, exchangeOrder, direction } = useAppState();
  const { webln } = useFediInjection();
  const toast = useToast();

  if (!exchangeOrder?.payAddress) return null;

  return (
    <Flex
      col
      gap={4}
      p={4}
      align="center"
      className="border border-lightGrey rounded-lg"
    >
      <Text variant="h2" weight="medium">
        Pay {coin} Address
      </Text>
      <Text className="text-center">
        To complete the exchange, pay <strong>exactly</strong>{" "}
        <button
          className="inline-flex underline text-grey gap-1 items-center active:text-black transition-colors"
          onClick={() =>
            navigator.clipboard.writeText(exchangeOrder.payAddress).then(() => {
              toast.show("Copied to clipboard");
            })
          }
        >
          <span>{exchangeOrder.fromAmount}</span>{" "}
          <Icon icon="IconCopy" className="w-4 h-4 shrink-0" />
        </button>{" "}
        {coin} to the following Address:
      </Text>
      <QRCode value={exchangeOrder.payAddress} size={200} />
      <Flex
        row
        gap={2}
        p={2}
        align="center"
        className="border border-solid border-lightGrey rounded-lg hover:bg-extraLightGrey transition-colors active:bg-extraLightGrey w-full"
        asChild
      >
        <button
          onClick={() =>
            navigator.clipboard.writeText(exchangeOrder.payAddress).then(() => {
              toast.show("Copied to clipboard");
            })
          }
        >
          <Text
            className="text-grey grow text-center"
            variant="caption"
            ellipsize
          >
            {exchangeOrder.payAddress}
          </Text>
          <Icon icon="IconCopy" className="w-4 h-4 shrink-0" />
        </button>
      </Flex>
      {direction === Direction.FromLightning && (
        <Button
          onClick={() =>
            webln.sendPayment(exchangeOrder.payAddress).catch(() => {})
          }
          width="full"
        >
          Pay
        </Button>
      )}
    </Flex>
  );
}
