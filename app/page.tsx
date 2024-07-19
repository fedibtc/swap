"use client";

import { AppScreen, useAppState } from "./components/app-state-provider";
import Home from "./screens/home";
import Status from "./screens/status";

export default function Index() {
  const { screen } = useAppState();
  switch (screen) {
    case AppScreen.Home:
      return <Home />;
    case AppScreen.Status:
      return <Status />;
  }
}
