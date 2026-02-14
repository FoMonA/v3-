import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { TaskList, type Task } from "../components/TaskList.js";
import {
  isNodeInstalled,
  installNode,
  isOpenClawInstalled,
  installOpenClaw,
} from "../lib/helpers.js";

type Props = {
  onComplete: () => void;
};

const INITIAL_TASKS: Task[] = [
  { label: "Node.js", status: "pending" },
  { label: "OpenClaw", status: "pending" },
];

export function Prerequisites({ onComplete }: Props) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);

  const updateTask = (index: number, update: Partial<Task>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
  };

  useEffect(() => {
    if (started) return;
    setStarted(true);

    const run = async () => {
      // 1. Check Node.js
      updateTask(0, { status: "active", label: "Checking Node.js..." });

      if (isNodeInstalled()) {
        updateTask(0, { status: "done", label: "Node.js" });
      } else {
        updateTask(0, { status: "active", label: "Installing Node.js..." });
        // Small delay to let the UI render
        await new Promise((r) => setTimeout(r, 100));
        const ok = installNode();
        if (ok) {
          updateTask(0, { status: "done", label: "Node.js installed" });
        } else {
          updateTask(0, {
            status: "error",
            label: "Node.js",
            detail: "Install manually: https://nodejs.org",
          });
          setFailed(true);
          return;
        }
      }

      // 2. Check OpenClaw
      updateTask(1, { status: "active", label: "Checking OpenClaw..." });

      if (isOpenClawInstalled()) {
        updateTask(1, { status: "done", label: "OpenClaw" });
      } else {
        updateTask(1, { status: "active", label: "Installing OpenClaw..." });
        await new Promise((r) => setTimeout(r, 100));
        const ok = installOpenClaw();
        if (ok) {
          updateTask(1, { status: "done", label: "OpenClaw installed" });
        } else {
          updateTask(1, {
            status: "error",
            label: "OpenClaw",
            detail: "Run: npm install -g openclaw@latest",
          });
          setFailed(true);
          return;
        }
      }

      // All good — advance
      setTimeout(onComplete, 1000);
    };

    run();
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Checking prerequisites...</Text>
      <TaskList tasks={tasks} />
      {failed && (
        <Text color="red" dimColor>
          Fix the above errors and re-run foma-setup.
        </Text>
      )}
    </Box>
  );
}
