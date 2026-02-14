import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { ConfirmInput, Spinner } from "@inkjs/ui";
import { isOpenClawInstalled, installOpenClaw } from "../lib/helpers.js";

type Props = {
  onComplete: () => void;
};

type State = "checking" | "installed" | "missing" | "installing" | "installed_now" | "failed";

export function Prerequisites({ onComplete }: Props) {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    if (isOpenClawInstalled()) {
      setState("installed");
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    } else {
      setState("missing");
    }
  }, []);

  const handleConfirm = () => {
    setState("installing");
    setTimeout(() => {
      const ok = installOpenClaw();
      if (ok) {
        setState("installed_now");
        setTimeout(onComplete, 1000);
      } else {
        setState("failed");
      }
    }, 100);
  };

  const handleCancel = () => {
    setState("failed");
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Checking prerequisites...</Text>

      {state === "checking" && <Spinner label="Checking OpenClaw..." />}

      {state === "installed" && (
        <Text color="green">✓ OpenClaw is installed</Text>
      )}

      {state === "missing" && (
        <Box flexDirection="column" gap={1}>
          <Text color="yellow">OpenClaw is not installed.</Text>
          <Box>
            <Text>Install OpenClaw now? </Text>
            <ConfirmInput onConfirm={handleConfirm} onCancel={handleCancel} />
          </Box>
        </Box>
      )}

      {state === "installing" && <Spinner label="Installing OpenClaw..." />}

      {state === "installed_now" && (
        <Text color="green">✓ OpenClaw installed successfully</Text>
      )}

      {state === "failed" && (
        <Box flexDirection="column">
          <Text color="red">✗ OpenClaw is required.</Text>
          <Text dimColor>Install manually: npm install -g openclaw@latest</Text>
        </Box>
      )}
    </Box>
  );
}
