"use client";

import { AppScreen, useAppState } from "./components/app-state-provider";
import FromLnStatus from "./screens/boltz/from-ln-status";
import ToLnStatus from "./screens/boltz/to-ln-status";
import Home from "./screens/home";
import Status from "./screens/status";

export default function Index() {
  const { screen } = useAppState();

  switch (screen) {
    case AppScreen.Home:
      return <Home />;
    case AppScreen.Status:
      return <Status />;
    case AppScreen.FromLnStatus:
      return <FromLnStatus />;
    case AppScreen.ToLnStatus:
      return <ToLnStatus />;
  }
}
