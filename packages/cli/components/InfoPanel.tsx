import React from "react";
import { Box, Text } from "ink";
import { INFO, type Step } from "../lib/info.js";
import { NETWORK } from "../lib/constants.js";

type Props = {
  step: Step;
};

export function InfoPanel({ step }: Props) {
  const info = INFO[step];

  return (
    <Box
      flexDirection="column"
      width="35%"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      paddingY={0}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {"💡 "}
          {info.title}
        </Text>
      </Box>

      {info.body.map((paragraph, i) => (
        <Box key={i} marginBottom={i < info.body.length - 1 ? 1 : 0}>
          <Text>{paragraph}</Text>
        </Box>
      ))}

      {info.tips && info.tips.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {info.tips.map((tip, i) => (
            <Text key={i} dimColor>
              • {tip}
            </Text>
          ))}
        </Box>
      )}

      <Box flexDirection="column" marginTop={1} borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} borderColor="gray">
        <Box marginTop={0}>
          <Text dimColor>Network: </Text>
          <Text>{NETWORK.name} ({NETWORK.chainId})</Text>
        </Box>
        <Box>
          <Text dimColor>RPC: </Text>
          <Text dimColor>{NETWORK.rpc}</Text>
        </Box>
      </Box>
    </Box>
  );
}
