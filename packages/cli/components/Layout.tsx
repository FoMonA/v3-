import React from "react";
import { Box } from "ink";
import { InfoPanel } from "./InfoPanel.js";
import type { Step } from "../lib/info.js";

type Props = {
  step: Step;
  children: React.ReactNode;
};

export function Layout({ step, children }: Props) {
  return (
    <Box flexDirection="row" width="100%">
      <Box flexDirection="column" width="65%" paddingRight={1}>
        {children}
      </Box>
      <InfoPanel step={step} />
    </Box>
  );
}
