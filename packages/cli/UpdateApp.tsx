import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { Select, Spinner, TextInput } from "@inkjs/ui";
import { Banner } from "./components/Banner.js";
import { Layout } from "./components/Layout.js";
import { TaskList, type Task } from "./components/TaskList.js";
import { BalanceMonitor } from "./steps/BalanceMonitor.js";
import {
  findWorkspaces,
  fetchTemplates,
  fetchScripts,
  copyRootTemplates,
  getWorkspaceEnv,
  setWorkspaceEnvVar,
  generateUserId,
  updateOpenClawConfig,
  stopAgent,
  startAgent,
} from "./lib/helpers.js";
import { OPENCLAW_DIR } from "./lib/constants.js";
import path from "path";

type Phase = "loading" | "select" | "config" | "updating" | "done" | "dashboard";

const INITIAL_TASKS: Task[] = [
  { label: "Fetch templates", status: "pending" },
  { label: "Fetch scripts", status: "pending" },
  { label: "Copy root templates", status: "pending" },
  { label: "Update OpenClaw config", status: "pending" },
  { label: "Restart agent", status: "pending" },
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
    setPhase("updating");
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

      // 4. Update OpenClaw config (heartbeat interval etc.)
      updateTask(3, { status: "active" });
      try {
        await updateOpenClawConfig(agentId, workspacePath);
        updateTask(3, { status: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(3, { status: "error", detail: msg });
      }

      // 5. Restart agent
      updateTask(4, { status: "active" });
      const wsAgentId = selectedWorkspace.replace("workspace-", "");
      stopAgent(wsAgentId);
      startAgent(wsAgentId);
      updateTask(4, { status: "done" });

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
