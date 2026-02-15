import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { getMonBalance, getFomaBalance, checkGatewayStatus } from "../lib/helpers.js";
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

type ActivityEntry = {
  timestamp: string;
  message: string;
  color: string;
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

function formatDelta(current: number, previous: number, decimals: number): string {
  const diff = current - previous;
  if (diff === 0) return "";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(decimals)}`;
}

export function BalanceMonitor({ address, agentId }: Props) {
  const [balances, setBalances] = useState<Balances>({
    mon: null,
    foma: null,
    updatedAt: "",
  });
  const prevBalances = useRef<{ mon: number; foma: number } | null>(null);
  const [deltas, setDeltas] = useState<{ mon: string; foma: string }>({ mon: "", foma: "" });
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [agentStatus, setAgentStatus] = useState<"checking" | "running" | "stopped">("checking");
  const { exit } = useApp();

  useInput((input) => {
    if (input === "q") {
      exit();
    }
  });

  const addActivity = (message: string, color: string = "white") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivity((prev) => [...prev.slice(-5), { timestamp, message, color }]);
  };

  const fetchBalances = async () => {
    const updatedAt = new Date().toLocaleTimeString();
    // Check agent status in parallel with balances
    checkGatewayStatus().then(setAgentStatus);
    try {
      const [mon, foma] = await Promise.all([
        getMonBalance(address),
        getFomaBalance(address).catch(() => "0"),
      ]);

      const monVal = parseFloat(mon);
      const fomaVal = parseFloat(foma);

      // Compute deltas and detect trades
      if (prevBalances.current !== null) {
        const prevMon = prevBalances.current.mon;
        const prevFoma = prevBalances.current.foma;

        const monDelta = formatDelta(monVal, prevMon, 4);
        const fomaDelta = formatDelta(fomaVal, prevFoma, 2);
        setDeltas({ mon: monDelta, foma: fomaDelta });

        // Detect buy: FOMA went up, MON went down
        if (fomaVal > prevFoma && monVal < prevMon) {
          const spent = (prevMon - monVal).toFixed(4);
          const got = (fomaVal - prevFoma).toFixed(2);
          addActivity(`Bought ${got} FOMA for ${spent} MON`, "green");
        }

        // Detect sell: FOMA went down, MON went up
        if (fomaVal < prevFoma && monVal > prevMon) {
          const got = (monVal - prevMon).toFixed(4);
          const sold = (prevFoma - fomaVal).toFixed(2);
          addActivity(`Sold ${sold} FOMA for ${got} MON`, "yellow");
        }

        // Detect incoming MON (funded)
        if (monVal > prevMon && fomaVal === prevFoma) {
          const received = (monVal - prevMon).toFixed(4);
          addActivity(`Received ${received} MON`, "cyan");
        }

        // Detect gas spend (MON down, FOMA unchanged)
        if (monVal < prevMon && fomaVal === prevFoma) {
          const spent = (prevMon - monVal).toFixed(4);
          addActivity(`Gas spent: ${spent} MON`, "gray");
        }
      } else {
        setDeltas({ mon: "", foma: "" });
      }

      prevBalances.current = { mon: monVal, foma: fomaVal };
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
              <Box width={14}>
                <Text color={monColor(monVal)}>
                  {monVal.toFixed(4)}
                </Text>
              </Box>
              <Box width={14}>
                {deltas.mon ? (
                  <Text color={deltas.mon.startsWith("+") ? "green" : "red"}>
                    {deltas.mon.startsWith("+") ? "▲" : "▼"} {deltas.mon}
                  </Text>
                ) : (
                  <Text dimColor>  —</Text>
                )}
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
              <Box width={14}>
                <Text color={fomaColor(fomaVal)}>
                  {fomaVal.toFixed(2)}
                </Text>
              </Box>
              <Box width={14}>
                {deltas.foma ? (
                  <Text color={deltas.foma.startsWith("+") ? "green" : "red"}>
                    {deltas.foma.startsWith("+") ? "▲" : "▼"} {deltas.foma}
                  </Text>
                ) : (
                  <Text dimColor>  —</Text>
                )}
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

      {/* Activity Log */}
      <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={2} paddingY={1} marginTop={1}>
        <Text bold color="magenta">Activity</Text>
        <Text> </Text>
        {activity.length === 0 ? (
          <Text dimColor>Watching for trades, transfers, and gas usage...</Text>
        ) : (
          activity.map((entry, i) => (
            <Box key={i}>
              <Text dimColor>[{entry.timestamp}] </Text>
              <Text color={entry.color}>{entry.message}</Text>
            </Box>
          ))
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
        {agentStatus === "checking" && <Text dimColor>Checking agent...</Text>}
        {agentStatus === "running" && <Text color="green">Agent running</Text>}
        {agentStatus === "stopped" && <Text color="red">Agent stopped — run: openclaw gateway --force</Text>}
      </Box>
    </Box>
  );
}
