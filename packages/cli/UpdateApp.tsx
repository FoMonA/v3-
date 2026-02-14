import React, { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { Select, Spinner } from "@inkjs/ui";
import { Banner } from "./components/Banner.js";
import { Layout } from "./components/Layout.js";
import { TaskList, type Task } from "./components/TaskList.js";
import {
  findWorkspaces,
  fetchTemplates,
  fetchScripts,
  copyRootTemplates,
  getWorkspaceEnv,
  generateUserId,
  stopAgent,
  startAgent,
} from "./lib/helpers.js";
import { OPENCLAW_DIR } from "./lib/constants.js";
import path from "path";

type Phase = "loading" | "select" | "updating" | "done";

const INITIAL_TASKS: Task[] = [
  { label: "Fetch templates", status: "pending" },
  { label: "Fetch scripts", status: "pending" },
  { label: "Copy root templates", status: "pending" },
  { label: "Restart agent", status: "pending" },
];

export function UpdateApp() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
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
        setPhase("updating");
      } else {
        setPhase("select");
      }
    });
  }, []);

  const updateTask = (index: number, update: Partial<Task>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
  };

  useEffect(() => {
    if (phase !== "updating" || !selectedWorkspace) return;

    const run = async () => {
      const workspacePath = path.join(OPENCLAW_DIR, selectedWorkspace);

      // Read env for template replacements
      let address = "";
      let agentId = "";
      try {
        const env = await getWorkspaceEnv(workspacePath);
        address = env.AGENT_ADDRESS || "";
        if (address) {
          const userId = generateUserId(address);
          agentId = `foma-${userId}`;
        }
      } catch {
        // Continue without replacements
      }

      // 1. Fetch templates
      updateTask(0, { status: "active" });
      try {
        const errors = await fetchTemplates(workspacePath, address, agentId);
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

      // 4. Restart agent
      updateTask(3, { status: "active" });
      const wsAgentId = selectedWorkspace.replace("workspace-", "");
      stopAgent(wsAgentId);
      startAgent(wsAgentId);
      updateTask(3, { status: "done" });

      setPhase("done");
    };

    run();
  }, [phase, selectedWorkspace]);

  const handleSelect = (value: string) => {
    setSelectedWorkspace(value);
    setPhase("updating");
  };

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

          {(phase === "updating" || phase === "done") && (
            <Box flexDirection="column" gap={1}>
              <Text dimColor>Workspace: {selectedWorkspace}</Text>
              <TaskList tasks={tasks} />
              {phase === "done" && (
                <Box marginTop={1}>
                  <Text color="green">
                    ✓ Agent {selectedWorkspace.replace("workspace-", "")} restarted with updated files
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
