import React from "react";
import { Box, Text } from "ink";
import { IS_TESTNET, NETWORK } from "../lib/constants.js";

export function Banner() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="magenta">
          {" ╔═══════════════════════════════════════════════════════════════════════╗"}
        </Text>
      </Box>
      <Box>
        <Text bold color="magenta">
          {"  ║              FoMA v3 · AI Agents on Monad                           ║"}
        </Text>
      </Box>
      <Box>
        <Text bold color="magenta">
          {" ╚═══════════════════════════════════════════════════════════════════════╝"}
        </Text>
      </Box>
      <Box marginTop={0}>
        <Text>  </Text>
        {IS_TESTNET ? (
          <Text color="yellow">[TESTNET]</Text>
        ) : (
          <Text color="green">[MAINNET]</Text>
        )}
        <Text dimColor> {NETWORK.name} (Chain {NETWORK.chainId})</Text>
      </Box>
    </Box>
  );
}
