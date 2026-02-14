import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { TaskList, type Task } from "../components/TaskList.js";
import {
  isRootOrSudo,
  isCurlInstalled,
  installCurl,
  isNodeInstalled,
  installNode,
  isOpenClawInstalled,
  installOpenClaw,
} from "../lib/helpers.js";

type Props = {
  onComplete: () => void;
};

const INITIAL_TASKS: Task[] = [
  { label: "curl", status: "pending" },
  { label: "Node.js", status: "pending" },
  { label: "OpenClaw", status: "pending" },
];

type Installer = {
  check: () => boolean;
  install: () => boolean;
  name: string;
  installedLabel: string;
  errorHint: string;
};

const INSTALLERS: Installer[] = [
  {
    check: isCurlInstalled,
    install: installCurl,
    name: "curl",
    installedLabel: "curl",
    errorHint: "apt-get install -y curl",
  },
  {
    check: isNodeInstalled,
    install: installNode,
    name: "Node.js",
    installedLabel: "Node.js",
    errorHint: "https://nodejs.org",
  },
  {
    check: isOpenClawInstalled,
    install: installOpenClaw,
    name: "OpenClaw",
    installedLabel: "OpenClaw",
    errorHint: "npm install -g openclaw@latest",
  },
];

export function Prerequisites({ onComplete }: Props) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [failed, setFailed] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const updateTask = (index: number, update: Partial<Task>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
  };

  useEffect(() => {
    if (started) return;
    setStarted(true);

    const run = async () => {
      for (let i = 0; i < INSTALLERS.length; i++) {
        const step = INSTALLERS[i];

        updateTask(i, { status: "active", label: `Checking ${step.name}...` });
        // Let UI render
        await new Promise((r) => setTimeout(r, 50));

        if (step.check()) {
          updateTask(i, { status: "done", label: step.installedLabel });
          continue;
        }

        // Need to install — check permissions
        if (!isRootOrSudo()) {
          updateTask(i, {
            status: "error",
            label: step.name,
            detail: "Run as root or with sudo",
          });
          setFailed(`Re-run with: sudo ./foma-setup`);
          return;
        }

        updateTask(i, { status: "active", label: `Installing ${step.name}...` });
        await new Promise((r) => setTimeout(r, 50));

        const ok = step.install();
        if (ok) {
          updateTask(i, { status: "done", label: `${step.installedLabel} installed` });
        } else {
          updateTask(i, {
            status: "error",
            label: step.name,
            detail: step.errorHint,
          });
          setFailed("Fix the above error and re-run foma-setup.");
          return;
        }
      }

      setTimeout(onComplete, 1000);
    };

    run();
  }, []);

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Setting up prerequisites...</Text>
      <TaskList tasks={tasks} />
      {failed && <Text color="red">{failed}</Text>}
    </Box>
  );
}
