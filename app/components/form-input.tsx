import { ChangeEventHandler } from "react";
import Flex from "./ui/flex";
import { Input, Text } from "@fedibtc/ui";

export default function FormInput({
  label,
  description,
  error,
  value,
  onChange,
  inputRight,
  ...inputProps
}: {
  label: string;
  description?: React.ReactNode;
  error?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  inputRight?: React.ReactNode;
} & React.ComponentProps<typeof Input>) {
  return (
    <Flex col gap={1} asChild>
      <label>
        <Flex row gap={2} justify="between" align="center">
          <Text weight="medium">{label}</Text>
          {error && (
            <Text variant="caption" className="text-red">
              {error}
            </Text>
          )}
        </Flex>
        {description && <Text variant="caption">{description}</Text>}
        <Flex row gap={2} align="center">
          <Input value={value} onChange={onChange} {...inputProps} />
          {inputRight}
        </Flex>
      </label>
    </Flex>
  );
}
