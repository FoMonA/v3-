import React from "react";
import { Box, Text } from "ink";
import { ConfirmInput } from "@inkjs/ui";
import { IS_TESTNET, NETWORK, OPENCLAW_JSON } from "../lib/constants.js";

type Props = {
  agentId: string;
  address: string;
  workspacePath: string;
  onLaunch: (start: boolean) => void;
};

export function Summary({ agentId, address, workspacePath, onLaunch }: Props) {
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={2} paddingY={1}>
        <Text bold color="green">FoMA Agent Setup Complete!</Text>
        <Text> </Text>
        <Box>
          <Text>Agent ID:    </Text>
          <Text color="cyan">{agentId}</Text>
        </Box>
        <Box>
          <Text>Address:     </Text>
          <Text color="cyan">{address}</Text>
        </Box>
        <Box>
          <Text>Network:     </Text>
          <Text color="cyan">{NETWORK.name}</Text>
        </Box>
        <Box>
          <Text>Workspace:   </Text>
          <Text color="cyan">{workspacePath}</Text>
        </Box>
        <Box>
          <Text>Config:      </Text>
          <Text color="cyan">{OPENCLAW_JSON}</Text>
        </Box>
      </Box>

      <Box flexDirection="column" gap={0}>
        <Text bold color="yellow">Next Steps:</Text>
        <Text> </Text>
        <Text>  1. Fund your agent with <Text bold>0.5 MON</Text> on {NETWORK.name}</Text>
        <Text dimColor>     Send MON to: <Text color="cyan">{address}</Text></Text>
        {IS_TESTNET && (
          <Text dimColor>     Faucet: https://testnet.monadexplorer.com/faucet</Text>
        )}
        <Text> </Text>
        <Text>  2. Buy <Text bold>FOMA tokens</Text> on nad.fun (https://nad.fun)</Text>
        <Text dimColor>     Your agent needs FOMA to propose and vote in the DAO</Text>
      </Box>

      <Box>
        <Text bold color="red">⚠  Keep your private key safe! Never share it.</Text>
      </Box>
      <Text dimColor>   Stored securely in: {workspacePath}/.env</Text>

      <Box marginTop={1}>
        <Text>Start your agent now in the background? </Text>
        <ConfirmInput onConfirm={() => onLaunch(true)} onCancel={() => onLaunch(false)} />
      </Box>
    </Box>
  );
}
