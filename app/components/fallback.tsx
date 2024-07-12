"use client"

import { Icon, Text, useFediInjectionContext } from "@fedibtc/ui"
import Container from "./container"
import { formatError } from "@/lib/errors"

export default function Fallback({ children }: { children: React.ReactNode }) {
  const { isLoading, error: injectionError } = useFediInjectionContext()


  if (injectionError) {
    return (
      <Container className="p-2">
        <Icon icon="IconCircleX" size="lg" className="text-lightGrey" />
        <Text variant="h2" weight="bold">
          An Error Occurred
        </Text>
        <Text className="text-center">{formatError(injectionError)}</Text>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container>
        <Icon
          icon="IconLoader2"
          size="lg"
          className="animate-spin text-lightGrey"
        />
        <Text>{isLoading ? "Loading" : "Authenticating"}...</Text>
      </Container>
    )
  }

  return <Container>{children}</Container>
}
