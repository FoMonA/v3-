import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import { startGateway, checkGatewayStatus } from "../lib/helpers.js";

type Props = {
  agentId: string;
  onComplete: () => void;
};

export function AgentLaunch({ agentId, onComplete }: Props) {
  const [status, setStatus] = useState<"starting" | "ok" | "failed">("starting");

  useEffect(() => {
    const run = async () => {
      startGateway();
      // Give the gateway a moment to start, then verify
      await new Promise((r) => setTimeout(r, 3000));
      const result = await checkGatewayStatus();
      if (result === "running") {
        setStatus("ok");
        setTimeout(onComplete, 1500);
      } else {
        setStatus("failed");
      }
    };
    run();
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      {status === "starting" && <Spinner label="Starting OpenClaw gateway..." />}
      {status === "ok" && (
        <Box flexDirection="column">
          <Text color="green">✓ Gateway started — agent {agentId} is active</Text>
          <Text dimColor>  Stop with: pkill -f 'openclaw gateway'</Text>
        </Box>
      )}
      {status === "failed" && (
        <Box flexDirection="column">
          <Text color="red">✗ Gateway failed to start</Text>
          <Text dimColor>  Try manually: openclaw gateway --force</Text>
          <Text dimColor>  Then check: openclaw health</Text>
        </Box>
      )}
    </Box>
  );
}
