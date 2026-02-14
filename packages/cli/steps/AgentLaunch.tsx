import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import { startGateway, checkGatewayStatus, triggerHeartbeat } from "../lib/helpers.js";

type Props = {
  agentId: string;
  onComplete: () => void;
};

export function AgentLaunch({ agentId, onComplete }: Props) {
  const [status, setStatus] = useState<"starting" | "ok" | "failed">("starting");

  useEffect(() => {
    const run = async () => {
      startGateway();
      // Retry health check a few times — gateway can take a while to start
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((r) => setTimeout(r, 3000));
        const result = await checkGatewayStatus();
        if (result === "running") {
          // Schedule first heartbeat after 3 min, then regular interval takes over
          triggerHeartbeat(agentId, 180);
          setStatus("ok");
          setTimeout(onComplete, 1500);
          return;
        }
      }
      setStatus("failed");
    };
    run();
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      {status === "starting" && <Spinner label="Starting OpenClaw gateway..." />}
      {status === "ok" && (
        <Box flexDirection="column">
          <Text color="green">✓ Gateway started — agent {agentId} is active</Text>
          <Text dimColor>  First heartbeat in ~3 min, then every 30 min</Text>
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
