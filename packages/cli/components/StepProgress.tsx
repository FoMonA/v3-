import React from "react";
import { Box, Text } from "ink";
import type { Step } from "../lib/info.js";

const VISIBLE_STEPS: { key: Step; label: string }[] = [
  { key: "prerequisites", label: "Prerequisites" },
  { key: "wallet", label: "Wallet" },
  { key: "workspace", label: "Workspace" },
  { key: "registration", label: "Register" },
  { key: "summary", label: "Launch" },
];

const STEP_ORDER: Step[] = [
  "existing",
  "prerequisites",
  "wallet",
  "workspace",
  "registration",
  "summary",
  "launch",
  "monitor",
];

function getStepIndex(step: Step): number {
  return STEP_ORDER.indexOf(step);
}

type Props = {
  currentStep: Step;
};

export function StepProgress({ currentStep }: Props) {
  const currentIdx = getStepIndex(currentStep);

  return (
    <Box marginBottom={1} gap={1} paddingLeft={1}>
      {VISIBLE_STEPS.map((s) => {
        const stepIdx = getStepIndex(s.key);
        const isDone = currentIdx > stepIdx;
        const isCurrent = currentStep === s.key;

        if (isDone) {
          return (
            <Box key={s.key} gap={0}>
              <Text color="green">● </Text>
              <Text color="green">{s.label}</Text>
              <Text dimColor>   </Text>
            </Box>
          );
        }
        if (isCurrent) {
          return (
            <Box key={s.key} gap={0}>
              <Text color="cyan">◐ </Text>
              <Text bold color="white">{s.label}</Text>
              <Text dimColor>   </Text>
            </Box>
          );
        }
        return (
          <Box key={s.key} gap={0}>
            <Text dimColor>○ </Text>
            <Text dimColor>{s.label}</Text>
            <Text dimColor>   </Text>
          </Box>
        );
      })}
    </Box>
  );
}
