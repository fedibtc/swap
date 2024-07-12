import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Rate } from ".";
import {
  useToast,
  Input,
  Text,
  Button,
  Dialog,
  Icon,
  Scanner,
  useWebLN,
} from "@fedibtc/ui";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Token } from "@/lib/constants";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";

const FormSchema = z.object({
  amount: z.number().min(0),
  address: z.string(),
});

export default function Send({
  rate,
  setOrder,
  token,
}: {
  rate?: Rate;
  setOrder: Dispatch<SetStateAction<{ token: string; id: string } | null>>;
  token: Token;
}) {
  const [scanning, setScanning] = useState(false);
  const toast = useToast();

  const webln = useWebLN();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: (rate?.from.min || 0) * 100000000,
      address: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (fields: z.infer<typeof FormSchema>) => {
      const { data, error } = await fetch("/api/send", {
        method: "POST",
        body: JSON.stringify({
          to: token,
          amount: fields.amount / 100000000,
          address: fields.address,
        }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }).then((r) => r.json());

      if (error) {
        toast.error(error);

        return;
      }

      if (data?.id) {
        setOrder({
          id: data.id,
          token: data.token,
        });
      }

      try {
        const { preimage } = await webln.sendPayment(data.invoice);

        if (preimage) {
          toast.show({
            content: "Payment sent",
            status: "success",
          });
        } else {
          toast.show({
            content: "The payment failed to go through",
            status: "error",
          });
        }
      } catch (err) {
        toast.error(err);
      }
    },
  });

  useEffect(() => {
    if (rate?.from.min && typeof rate.from.min === "number") {
      form.setValue("amount", Math.round(rate?.from.min * 100000000));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate?.from.min]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="flex flex-col gap-4 w-full grow items-stretch"
      >
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (Sats)</FormLabel>
              <Input
                value={String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                placeholder="69420"
                min={(rate?.from.min || 0) * 100000000}
                max={(rate?.from.max || 0) * 100000000}
                type="number"
                step="any"
              />
              <Text variant="small" className="text-grey">
                + Swap Fee: {Math.round(field.value / 100)} sats
              </Text>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <div className="flex gap-sm">
                <Button
                  className="!p-sm w-xxl shrink-0 rounded-lg !border !border-lightGrey"
                  variant="outline"
                  type="button"
                  onClick={() => setScanning(true)}
                >
                  <Icon icon="IconQrcode" className="w-xl h-xl" />
                </Button>
                <Input
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="0xAb5801a7D398351b8bE11C439..."
                />
              </div>
              <Dialog
                open={scanning}
                onOpenChange={setScanning}
                title="Scan Address"
              >
                <Scanner
                  scanning={scanning}
                  onResult={(res) => {
                    field.onChange(res);
                    setScanning(false);
                  }}
                  onError={console.log}
                />
              </Dialog>
            </FormItem>
          )}
        />

        <div className="grow" />

        <Button loading={mutation.status === "pending"}>Submit</Button>
      </form>
    </Form>
  );
}
