import React, { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { getMonBalance } from "../lib/helpers.js";
import { NETWORK } from "../lib/constants.js";

type BalanceEntry = {
  timestamp: string;
  balance: string;
  error?: string;
};

type Props = {
  address: string;
};

function balanceColor(balance: string): string {
  const val = parseFloat(balance);
  if (val > 0.3) return "green";
  if (val >= 0.1) return "yellow";
  return "red";
}

export function BalanceMonitor({ address }: Props) {
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const { exit } = useApp();

  useInput((input) => {
    if (input === "q") {
      exit();
    }
  });

  const fetchBalance = async () => {
    const timestamp = new Date().toLocaleTimeString();
    try {
      const balance = await getMonBalance(address);
      setEntries((prev) => [...prev.slice(-9), { timestamp, balance }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEntries((prev) => [
        ...prev.slice(-9),
        { timestamp, balance: "0", error: msg },
      ]);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30_000);
    return () => clearInterval(interval);
  }, []);

  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Balance Monitor</Text>
      <Text dimColor>Polling every 30s · Press q to exit</Text>

      <Box flexDirection="column" marginTop={1}>
        {entries.length === 0 && <Text dimColor>Fetching balance...</Text>}
        {entries.map((entry, i) => (
          <Box key={i}>
            <Text dimColor>[{entry.timestamp}]</Text>
            <Text> {shortAddr} </Text>
            {entry.error ? (
              <Text color="red">Error: {entry.error}</Text>
            ) : (
              <Text color={balanceColor(entry.balance)}>
                {entry.balance} {NETWORK.currency}
              </Text>
            )}
            <Text dimColor> ({NETWORK.name})</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
