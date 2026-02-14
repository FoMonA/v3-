import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { TaskList, type Task } from "../components/TaskList.js";
import {
  createWorkspaceDir,
  writeEnvFile,
  fetchTemplates,
  copyRootTemplates,
  fetchScripts,
  installScriptDeps,
  updateOpenClawConfig,
  generateUserId,
} from "../lib/helpers.js";
import { OPENCLAW_DIR } from "../lib/constants.js";
import path from "path";

type Props = {
  address: string;
  privateKey: string;
  userId: string;
  minFoma: number;
  model?: string;
  onComplete: (data: { workspacePath: string; agentId: string }) => void;
};

const INITIAL_TASKS: Task[] = [
  { label: "Create directory structure", status: "pending" },
  { label: "Write environment config", status: "pending" },
  { label: "Fetch templates from GitHub", status: "pending" },
  { label: "Fetch scripts from GitHub", status: "pending" },
  { label: "Install script dependencies", status: "pending" },
  { label: "Update OpenClaw config", status: "pending" },
];

export function WorkspaceSetup({ address, privateKey, userId, minFoma, model, onComplete }: Props) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [started, setStarted] = useState(false);

  const agentId = `foma-${userId}`;
  const workspaceName = `workspace-foma-${userId}`;
  const workspacePath = path.join(OPENCLAW_DIR, workspaceName);

  const updateTask = (index: number, update: Partial<Task>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
  };

  useEffect(() => {
    if (started) return;
    setStarted(true);

    const run = async () => {
      // 1. Create directory
      updateTask(0, { status: "active" });
      try {
        await createWorkspaceDir(workspacePath);
        updateTask(0, { status: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(0, { status: "error", detail: msg });
        return;
      }

      // 2. Write .env
      updateTask(1, { status: "active" });
      try {
        await writeEnvFile(workspacePath, address, privateKey, minFoma);
        updateTask(1, { status: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(1, { status: "error", detail: msg });
        return;
      }

      // 3. Fetch templates
      updateTask(2, { status: "active" });
      try {
        const errors = await fetchTemplates(workspacePath, address, agentId, minFoma);
        await copyRootTemplates(workspacePath);
        if (errors.length > 0) {
          updateTask(2, { status: "done", detail: `${errors.length} warning(s)` });
        } else {
          updateTask(2, { status: "done" });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(2, { status: "error", detail: msg });
      }

      // 4. Fetch scripts
      updateTask(3, { status: "active" });
      try {
        const errors = await fetchScripts(workspacePath);
        if (errors.length > 0) {
          updateTask(3, { status: "done", detail: `${errors.length} warning(s)` });
        } else {
          updateTask(3, { status: "done" });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(3, { status: "error", detail: msg });
      }

      // 5. Install deps
      updateTask(4, { status: "active" });
      try {
        await installScriptDeps(workspacePath);
        updateTask(4, { status: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(4, { status: "done", detail: `skipped: ${msg}` });
      }

      // 6. Update openclaw.json
      updateTask(5, { status: "active" });
      try {
        await updateOpenClawConfig(agentId, workspacePath, model);
        updateTask(5, { status: "done" });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        updateTask(5, { status: "error", detail: msg });
        return;
      }

      // Done
      setTimeout(() => onComplete({ workspacePath, agentId }), 1000);
    };

    run();
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Creating agent workspace...</Text>
      <TaskList tasks={tasks} />
    </Box>
  );
}
