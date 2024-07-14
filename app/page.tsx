"use client";

import { AppScreen, useAppState } from "./components/app-state-provider";
import Complete from "./screens/complete";
import Home from "./screens/home";
import Status from "./screens/status";

export default function Index() {
  const { screen } = useAppState();
  switch (screen) {
    case AppScreen.Home:
      return <Home />;
    case AppScreen.Pending:
      return <Status />;
    case AppScreen.Complete:
      return <Complete />;
  }
}
