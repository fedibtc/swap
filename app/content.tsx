"use client";

import {
  AppScreen,
  useAppState,
} from "./components/providers/app-state-provider";
import AmountScreen from "./screens/amount";
import FromLnStatus from "./screens/boltz/from-ln-status";
import ToLnStatus from "./screens/boltz/to-ln-status";
import Status from "./screens/status";
import ConfirmScreen from "./screens/confirm";
import AddressScreen from "./screens/address";

export default function Content() {
  const { screen } = useAppState();

  switch (screen) {
    case AppScreen.Home:
      return <AmountScreen />;
    case AppScreen.Address:
      return <AddressScreen />;
    case AppScreen.Confirmation:
      return <ConfirmScreen />;
    case AppScreen.Status:
      return <Status />;
    case AppScreen.FromLnStatus:
      return <FromLnStatus />;
    case AppScreen.ToLnStatus:
      return <ToLnStatus />;
  }
}
