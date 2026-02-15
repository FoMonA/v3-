import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { Select, Spinner, TextInput } from "@inkjs/ui";
import { Banner } from "./components/Banner.js";
import { Layout } from "./components/Layout.js";
import { TaskList, type Task } from "./components/TaskList.js";
import { BalanceMonitor } from "./steps/BalanceMonitor.js";
import { ApiKeySetup, type ApiKeyData } from "./steps/ApiKeySetup.js";
import {
  findWorkspaces,
  fetchTemplates,
  fetchScripts,
  copyRootTemplates,
  getWorkspaceEnv,
  setWorkspaceEnvVar,
  switchWorkspaceNetwork,
  generateUserId,
  updateOpenClawConfig,
  saveApiKey,
  stopGateway,
  startGateway,
  checkGatewayStatus,
} from "./lib/helpers.js";
import { OPENCLAW_DIR, IS_TESTNET } from "./lib/constants.js";
import path from "path";

type Phase = "loading" | "select" | "network-switch" | "config" | "apikey" | "updating" | "done" | "dashboard";

const INITIAL_TASKS: Task[] = [
  { label: "Fetch templates", status: "pending" },
  { label: "Fetch scripts", status: "pending" },
  { label: "Copy root templates", status: "pending" },
  { label: "Update OpenClaw config", status: "pending" },
  { label: "Restart gateway", status: "pending" },
];

export function UpdateApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [agentAddress, setAgentAddress] = useState("");
  const [agentId, setAgentId] = useState("");
  const [minFoma, setMinFoma] = useState(50);
  const [existingMinFoma, setExistingMinFoma] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
  const [workspaceNetwork, setWorkspaceNetwork] = useState<string | null>(null);
  const { exit } = useApp();

  useEffect(() => {
    findWorkspaces().then((ws) => {
      if (ws.length === 0) {
        setPhase("done");
        return;
      }
      setWorkspaces(ws);
      if (ws.length === 1) {
        setSelectedWorkspace(ws[0]);
        loadEnvAndConfig(ws[0]);
      } else {
        setPhase("select");
      }
    });
  }, []);

  const loadEnvAndConfig = async (workspace: string) => {
    const workspacePath = path.join(OPENCLAW_DIR, workspace);
    try {
      const env = await getWorkspaceEnv(workspacePath);
      setAgentAddress(env.AGENT_ADDRESS || "");
      if (env.AGENT_ADDRESS) {
        const userId = generateUserId(env.AGENT_ADDRESS);
        setAgentId(`foma-${userId}`);
      }
      if (env.MIN_FOMA_BALANCE) {
        setExistingMinFoma(env.MIN_FOMA_BALANCE);
        setMinFoma(parseInt(env.MIN_FOMA_BALANCE, 10) || 50);
      }

      // Detect network mismatch
      const wsNetwork = env.NETWORK || "testnet";
      setWorkspaceNetwork(wsNetwork);
      const cliIsTestnet = IS_TESTNET;
      const wsIsTestnet = wsNetwork === "testnet";
      if (cliIsTestnet !== wsIsTestnet) {
        setPhase("network-switch");
        return;
      }
    } catch {
      // Continue with defaults
    }
    setPhase("config");
  };

  const handleSelect = (value: string) => {
    setSelectedWorkspace(value);
    loadEnvAndConfig(value);
  };

  const handleMinFoma = (value: string) => {
    const num = parseInt(value.trim(), 10);
    if (isNaN(num) || num < 0) {
      setConfigError("Enter a valid number (e.g. 50)");
      return;
    }
    setConfigError(null);
    setMinFoma(num);
    setPhase("apikey");
  };

  const updateTask = (index: number, update: Partial<Task>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
  };

  useEffect(() => {
    if (phase !== "updating" || !selectedWorkspace) return;

    const run = async () => {
      const workspacePath = path.join(OPENCLAW_DIR, selectedWorkspace);

      // Save minFoma to .env
      await setWorkspaceEnvVar(workspacePath, "MIN_FOMA_BALANCE", String(minFoma));

      // 1. Fetch templates
      updateTask(0, { status: "active" });
      try {
        const errors = await fetchTemplates(workspacePath, agentAddress, agentId, minFoma);
        updateTask(0, {
          status: "done",
          detail: errors.length > 0 ? `${errors.length} warning(s)` : undefined,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(0, { status: "error", detail: msg });
      }

      // 2. Fetch scripts
      updateTask(1, { status: "active" });
      try {
        const errors = await fetchScripts(workspacePath);
        updateTask(1, {
          status: "done",
          detail: errors.length > 0 ? `${errors.length} warning(s)` : undefined,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(1, { status: "error", detail: msg });
      }

      // 3. Copy root templates
      updateTask(2, { status: "active" });
      try {
        await copyRootTemplates(workspacePath);
        updateTask(2, { status: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(2, { status: "error", detail: msg });
      }

      // 4. Update OpenClaw config (heartbeat interval, model etc.)
      updateTask(3, { status: "active" });
      try {
        await updateOpenClawConfig(agentId, workspacePath, apiKeyData?.model);
        updateTask(3, { status: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(3, { status: "error", detail: msg });
      }

      // 5. Restart gateway
      updateTask(4, { status: "active" });
      stopGateway();
      startGateway();
      // Retry health check — gateway can take a while to start
      let gwStarted = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((r) => setTimeout(r, 3000));
        const gwStatus = await checkGatewayStatus();
        if (gwStatus === "running") {
          gwStarted = true;
          break;
        }
      }
      if (gwStarted) {
        updateTask(4, { status: "done" });
      } else {
        updateTask(4, { status: "error", detail: "Gateway failed to start — run: openclaw gateway --force" });
      }

      setPhase("done");
      setTimeout(() => setPhase("dashboard"), 2000);
    };

    run();
  }, [phase, selectedWorkspace]);

  // Dashboard phase
  if (phase === "dashboard" && agentAddress) {
    return (
      <Box flexDirection="column">
        <Banner />
        <BalanceMonitor address={agentAddress} agentId={agentId} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Banner />
      <Layout step="workspace">
        <Box flexDirection="column" gap={1}>
          <Text bold color="cyan">Updating workspace...</Text>

          {phase === "loading" && <Spinner label="Finding workspaces..." />}

          {phase === "select" && (
            <Box flexDirection="column" gap={1}>
              <Text>Which workspace do you want to update?</Text>
              <Select
                options={workspaces.map((ws) => ({ label: ws, value: ws }))}
                onChange={handleSelect}
              />
            </Box>
          )}

          {phase === "network-switch" && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text color="yellow">
                Network mismatch detected: workspace is on{" "}
                <Text bold>{workspaceNetwork === "testnet" ? "Testnet" : "Mainnet"}</Text>
                , CLI is targeting{" "}
                <Text bold>{IS_TESTNET ? "Testnet" : "Mainnet"}</Text>.
              </Text>
              <Text>Would you like to switch the workspace network?</Text>
              <Select
                options={
                  IS_TESTNET
                    ? [
                        { label: "Switch to Testnet", value: "switch" },
                        { label: `Keep ${workspaceNetwork === "testnet" ? "Testnet" : "Mainnet"}`, value: "keep" },
                      ]
                    : [
                        { label: "Switch to Mainnet (recommended)", value: "switch" },
                        { label: `Keep ${workspaceNetwork === "testnet" ? "Testnet" : "Mainnet"}`, value: "keep" },
                      ]
                }
                onChange={async (value) => {
                  if (value === "switch") {
                    const workspacePath = path.join(OPENCLAW_DIR, selectedWorkspace);
                    await switchWorkspaceNetwork(workspacePath, IS_TESTNET);
                  }
                  setPhase("config");
                }}
              />
            </Box>
          )}

          {phase === "config" && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text> </Text>
              <Text>Minimum FOMA balance to maintain?</Text>
              <Text dimColor>
                Your agent auto-buys FOMA when below this threshold.
              </Text>
              <TextInput
                defaultValue={String(minFoma)}
                onSubmit={handleMinFoma}
              />
              {configError && <Text color="red">{configError}</Text>}
            </Box>
          )}

          {phase === "apikey" && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text dimColor>Min FOMA: {minFoma}</Text>
              <ApiKeySetup
                onComplete={async (data) => {
                  if (data.apiKey) {
                    await saveApiKey(data.envVar, data.apiKey);
                  }
                  setApiKeyData(data);
                  setPhase("updating");
                }}
              />
            </Box>
          )}

          {(phase === "updating" || phase === "done") && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text dimColor>Min FOMA: {minFoma}</Text>
              <TaskList tasks={tasks} />
              {phase === "done" && (
                <Box marginTop={1}>
                  <Text color="green">
                    ✓ Agent {selectedWorkspace.replace("workspace-", "")} restarted — loading dashboard...
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {phase === "done" && workspaces.length === 0 && (
            <Text color="red">No FoMA workspaces found. Run setup first.</Text>
          )}
        </Box>
      </Layout>
    </Box>
  );
}
