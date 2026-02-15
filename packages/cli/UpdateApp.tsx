import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { Select, Spinner, TextInput } from "@inkjs/ui";
import { Banner } from "./components/Banner.js";
import { Layout } from "./components/Layout.js";
import { TaskList, type Task } from "./components/TaskList.js";
import { BalanceMonitor } from "./steps/BalanceMonitor.js";
import { PROVIDERS } from "./steps/ApiKeySetup.js";
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
  getExistingApiKey,
  getExistingModel,
} from "./lib/helpers.js";
import { OPENCLAW_DIR, IS_TESTNET } from "./lib/constants.js";
import path from "path";

type Phase =
  | "loading"
  | "select"
  | "network-switch"
  | "menu"
  | "change-model-provider"
  | "change-model"
  | "change-key-provider"
  | "change-key"
  | "change-minfoma"
  | "updating"
  | "done"
  | "dashboard";

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
  const [workspaceNetwork, setWorkspaceNetwork] = useState<string | null>(null);
  const { exit } = useApp();

  // Current config (loaded from existing setup)
  const [currentProvider, setCurrentProvider] = useState<(typeof PROVIDERS)[number] | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [currentMaskedKey, setCurrentMaskedKey] = useState<string>("");

  // Pending changes (null = keep existing)
  const [pendingModel, setPendingModel] = useState<string | null>(null);
  const [pendingApiKey, setPendingApiKey] = useState<{ envVar: string; apiKey: string } | null>(null);

  // Temp state for sub-flow provider selection
  const [changeProvider, setChangeProvider] = useState<(typeof PROVIDERS)[number] | null>(null);

  // Config errors
  const [configError, setConfigError] = useState<string | null>(null);

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

    // Load existing config for menu display
    const [existingKey, existingModel] = await Promise.all([
      getExistingApiKey(),
      getExistingModel(),
    ]);

    if (existingKey) {
      const provider = PROVIDERS.find((p) => p.envVar === existingKey.envVar);
      if (provider) {
        setCurrentProvider(provider);
        setCurrentMaskedKey(existingKey.maskedKey);
      }
    }
    if (existingModel) {
      setCurrentModel(existingModel);
    }

    setPhase("menu");
  };

  const handleSelect = (value: string) => {
    setSelectedWorkspace(value);
    loadEnvAndConfig(value);
  };

  const updateTask = (index: number, update: Partial<Task>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
  };

  // Derive display values (pending overrides current)
  const displayModel = pendingModel ?? currentModel ?? "Not set";
  const displayProvider = (() => {
    if (pendingModel) {
      // Find provider from pending model string
      const p = PROVIDERS.find((prov) => prov.models.some((m) => m.value === pendingModel));
      if (p) return p.label.split("—")[0].trim();
    }
    if (pendingApiKey) {
      const p = PROVIDERS.find((prov) => prov.envVar === pendingApiKey.envVar);
      if (p) return p.label.split("—")[0].trim();
    }
    return currentProvider?.label.split("—")[0].trim() ?? "Not set";
  })();
  const displayKey = pendingApiKey
    ? `${pendingApiKey.apiKey.slice(0, 4)}...${pendingApiKey.apiKey.slice(-4)}`
    : currentMaskedKey || "Not set";

  useEffect(() => {
    if (phase !== "updating" || !selectedWorkspace) return;

    const run = async () => {
      const workspacePath = path.join(OPENCLAW_DIR, selectedWorkspace);

      // Save API key if changed
      if (pendingApiKey) {
        await saveApiKey(pendingApiKey.envVar, pendingApiKey.apiKey);
      }

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
        const finalModel = pendingModel ?? currentModel ?? undefined;
        await updateOpenClawConfig(agentId, workspacePath, finalModel);
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
                  // Load existing config before going to menu
                  const [existingKey, existingModel] = await Promise.all([
                    getExistingApiKey(),
                    getExistingModel(),
                  ]);
                  if (existingKey) {
                    const provider = PROVIDERS.find((p) => p.envVar === existingKey.envVar);
                    if (provider) {
                      setCurrentProvider(provider);
                      setCurrentMaskedKey(existingKey.maskedKey);
                    }
                  }
                  if (existingModel) {
                    setCurrentModel(existingModel);
                  }
                  setPhase("menu");
                }}
              />
            </Box>
          )}

          {/* ── Config Menu ── */}
          {phase === "menu" && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text> </Text>
              <Text bold>Current Configuration:</Text>
              <Text>  Provider: {displayProvider}</Text>
              <Text>  Model:    {displayModel}</Text>
              <Text>  Key:      {displayKey}</Text>
              <Text>  Min FOMA: {minFoma}</Text>
              <Text> </Text>
              <Select
                options={[
                  { label: "Change model", value: "model" },
                  { label: "Change API key", value: "key" },
                  { label: "Change min FOMA balance", value: "minfoma" },
                  { label: "Continue with update →", value: "continue" },
                ]}
                onChange={(value) => {
                  if (value === "model") setPhase("change-model-provider");
                  else if (value === "key") setPhase("change-key-provider");
                  else if (value === "minfoma") setPhase("change-minfoma");
                  else setPhase("updating");
                }}
              />
            </Box>
          )}

          {/* ── Change Model: pick provider ── */}
          {phase === "change-model-provider" && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text> </Text>
              <Text>Which provider's models do you want to choose from?</Text>
              <Select
                options={PROVIDERS.map((p) => ({ label: p.label, value: p.value }))}
                onChange={(value) => {
                  const provider = PROVIDERS.find((p) => p.value === value)!;
                  setChangeProvider(provider);
                  setPhase("change-model");
                }}
              />
            </Box>
          )}

          {/* ── Change Model: pick model ── */}
          {phase === "change-model" && changeProvider && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text dimColor>Provider: {changeProvider.label.split("—")[0].trim()}</Text>
              <Text> </Text>
              <Text>Which model should your agent use?</Text>
              <Select
                options={changeProvider.models}
                onChange={(value) => {
                  setPendingModel(value);
                  setChangeProvider(null);
                  setPhase("menu");
                }}
              />
            </Box>
          )}

          {/* ── Change API Key: pick provider ── */}
          {phase === "change-key-provider" && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text> </Text>
              <Text>Which provider's API key do you want to set?</Text>
              <Select
                options={PROVIDERS.map((p) => ({ label: p.label, value: p.value }))}
                onChange={(value) => {
                  const provider = PROVIDERS.find((p) => p.value === value)!;
                  setChangeProvider(provider);
                  setPhase("change-key");
                }}
              />
            </Box>
          )}

          {/* ── Change API Key: enter key ── */}
          {phase === "change-key" && changeProvider && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text dimColor>Provider: {changeProvider.label.split("—")[0].trim()}</Text>
              <Text> </Text>
              <Text>Enter your {changeProvider.label.split(" ")[0]} API key:</Text>
              <Text dimColor>Format: {changeProvider.hint}</Text>
              <TextInput
                placeholder={changeProvider.hint}
                onSubmit={(value) => {
                  const trimmed = value.trim();
                  if (!trimmed) return;
                  setPendingApiKey({ envVar: changeProvider.envVar, apiKey: trimmed });
                  setChangeProvider(null);
                  setPhase("menu");
                }}
              />
            </Box>
          )}

          {/* ── Change Min FOMA ── */}
          {phase === "change-minfoma" && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text> </Text>
              <Text>Minimum FOMA balance to maintain?</Text>
              <Text dimColor>Your agent auto-buys FOMA when below this threshold.</Text>
              <TextInput
                defaultValue={String(minFoma)}
                onSubmit={(value) => {
                  const num = parseInt(value.trim(), 10);
                  if (isNaN(num) || num < 0) {
                    setConfigError("Enter a valid number (e.g. 50)");
                    return;
                  }
                  setConfigError(null);
                  setMinFoma(num);
                  setPhase("menu");
                }}
              />
              {configError && <Text color="red">{configError}</Text>}
            </Box>
          )}

          {/* ── Updating / Done ── */}
          {(phase === "updating" || phase === "done") && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <Text dimColor>Model: {pendingModel ?? currentModel ?? "default"}</Text>
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
