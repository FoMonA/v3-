import React, { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { getMonBalance, getFomaBalance } from "../lib/helpers.js";
import { NETWORK, CONTRACT_ADDRESSES } from "../lib/constants.js";

type Props = {
  address: string;
  agentId: string;
};

type Balances = {
  mon: string | null;
  foma: string | null;
  error?: string;
  updatedAt: string;
};

function monColor(val: number): string {
  if (val > 0.3) return "green";
  if (val >= 0.1) return "yellow";
  return "red";
}

function fomaColor(val: number): string {
  if (val >= 50) return "green";
  if (val >= 10) return "yellow";
  return "red";
}

function monStatus(val: number): string {
  if (val > 0.3) return "Healthy";
  if (val >= 0.1) return "Low — top up soon";
  return "Critical — needs funding!";
}

function fomaStatus(val: number): string {
  if (val >= 50) return "Healthy";
  if (val >= 10) return "Low — buy more FOMA";
  if (val > 0) return "Very low";
  return "None — buy FOMA to govern";
}

function bar(val: number, max: number, width: number): string {
  const filled = Math.min(Math.round((val / max) * width), width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export function BalanceMonitor({ address, agentId }: Props) {
  const [balances, setBalances] = useState<Balances>({
    mon: null,
    foma: null,
    updatedAt: "",
  });
  const [polling, setPollling] = useState(true);
  const { exit } = useApp();

  useInput((input) => {
    if (input === "q") {
      exit();
    }
  });

  const fetchBalances = async () => {
    const updatedAt = new Date().toLocaleTimeString();
    try {
      const [mon, foma] = await Promise.all([
        getMonBalance(address),
        getFomaBalance(address).catch(() => "0"),
      ]);
      setBalances({ mon, foma, updatedAt });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBalances((prev) => ({ ...prev, error: msg, updatedAt }));
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30_000);
    return () => clearInterval(interval);
  }, []);

  const monVal = parseFloat(balances.mon ?? "0");
  const fomaVal = parseFloat(balances.foma ?? "0");
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const loading = balances.mon === null;

  return (
    <Box flexDirection="column">
      {/* Agent Info */}
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
        <Text bold color="cyan">Agent Dashboard</Text>
        <Text> </Text>
        <Box>
          <Text dimColor>{"Agent ID:   "}</Text>
          <Text bold>{agentId}</Text>
        </Box>
        <Box>
          <Text dimColor>{"Wallet:     "}</Text>
          <Text color="cyan">{address}</Text>
        </Box>
        <Box>
          <Text dimColor>{"Network:    "}</Text>
          <Text>{NETWORK.name} ({NETWORK.chainId})</Text>
        </Box>
        <Box>
          <Text dimColor>{"Explorer:   "}</Text>
          <Text dimColor>{NETWORK.explorer}/address/{address}</Text>
        </Box>
      </Box>

      {/* Balances */}
      <Box flexDirection="column" borderStyle="round" borderColor="white" paddingX={2} paddingY={1} marginTop={1}>
        <Text bold>Balances</Text>
        <Text> </Text>

        {loading ? (
          <Text dimColor>Fetching balances...</Text>
        ) : (
          <>
            {/* MON */}
            <Box>
              <Box width={10}>
                <Text bold color={monColor(monVal)}>MON</Text>
              </Box>
              <Box width={16}>
                <Text color={monColor(monVal)}>
                  {monVal.toFixed(4)}
                </Text>
              </Box>
              <Box width={14}>
                <Text color={monColor(monVal)}>{bar(monVal, 2, 10)}</Text>
              </Box>
              <Text dimColor>{monStatus(monVal)}</Text>
            </Box>

            {/* FOMA */}
            <Box>
              <Box width={10}>
                <Text bold color={fomaColor(fomaVal)}>FOMA</Text>
              </Box>
              <Box width={16}>
                <Text color={fomaColor(fomaVal)}>
                  {fomaVal.toFixed(2)}
                </Text>
              </Box>
              <Box width={14}>
                <Text color={fomaColor(fomaVal)}>{bar(fomaVal, 200, 10)}</Text>
              </Box>
              <Text dimColor>{fomaStatus(fomaVal)}</Text>
            </Box>
          </>
        )}

        {balances.error && (
          <Box marginTop={1}>
            <Text color="red">Error: {balances.error}</Text>
          </Box>
        )}
      </Box>

      {/* Contracts */}
      <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={2} paddingY={1} marginTop={1}>
        <Text bold dimColor>Contracts</Text>
        <Text> </Text>
        <Box>
          <Text dimColor>{"FOMA Token: "}</Text>
          <Text dimColor>{CONTRACT_ADDRESSES.FOMA}</Text>
        </Box>
        <Box>
          <Text dimColor>{"Governor:   "}</Text>
          <Text dimColor>{CONTRACT_ADDRESSES.GOVERNOR}</Text>
        </Box>
        <Box>
          <Text dimColor>{"Registry:   "}</Text>
          <Text dimColor>{CONTRACT_ADDRESSES.REGISTRY}</Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1} paddingX={1} gap={2}>
        <Text dimColor>
          Updated: {balances.updatedAt || "..."}
        </Text>
        <Text dimColor>·</Text>
        <Text dimColor>Refreshes every 30s</Text>
        <Text dimColor>·</Text>
        <Text dimColor>Press </Text>
        <Text bold>q</Text>
        <Text dimColor> to exit</Text>
        <Text dimColor>·</Text>
        <Text color="green">Agent running</Text>
      </Box>
    </Box>
  );
}
