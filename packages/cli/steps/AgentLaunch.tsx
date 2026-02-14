import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import { startAgent } from "../lib/helpers.js";

type Props = {
  agentId: string;
  onComplete: () => void;
};

export function AgentLaunch({ agentId, onComplete }: Props) {
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    startAgent(agentId);
    setLaunched(true);
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      {!launched && <Spinner label={`Starting agent ${agentId}...`} />}
      {launched && (
        <Box flexDirection="column">
          <Text color="green">✓ Agent {agentId} started in the background</Text>
          <Text dimColor>  Stop with: openclaw stop {agentId}</Text>
        </Box>
      )}
    </Box>
  );
}
