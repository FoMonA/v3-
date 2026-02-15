import React from "react";
import { Box, Text } from "ink";
import { Select } from "@inkjs/ui";

type Props = {
  workspaces: string[];
  workspaceNetworks?: Record<string, string>;
  onUpdate: () => void;
  onNew: () => void;
  onCancel: () => void;
};

export function ExistingWorkspace({ workspaces, workspaceNetworks, onUpdate, onNew, onCancel }: Props) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text color="yellow">
        Existing workspace{workspaces.length > 1 ? "s" : ""} found:
      </Text>
      {workspaces.map((ws) => {
        const net = workspaceNetworks?.[ws];
        const tag = net === "testnet" ? "[TESTNET]" : net === "mainnet" ? "[MAINNET]" : "";
        return (
          <Text key={ws} dimColor>
            {"  "}{ws} {tag && <Text color={net === "testnet" ? "yellow" : "green"}>{tag}</Text>}
          </Text>
        );
      })}
      <Box marginTop={1}>
        <Text>What would you like to do?</Text>
      </Box>
      <Select
        options={[
          { label: "Update templates and scripts", value: "update" },
          { label: "Set up a new agent (new wallet)", value: "new" },
          { label: "Cancel", value: "cancel" },
        ]}
        onChange={(value) => {
          if (value === "update") onUpdate();
          else if (value === "new") onNew();
          else onCancel();
        }}
      />
    </Box>
  );
}
