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
  type LogFn,
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
  install: (onLog?: LogFn) => Promise<boolean>;
  name: string;
  errorHint: string;
};

const INSTALLERS: Installer[] = [
  {
    check: isCurlInstalled,
    install: installCurl,
    name: "curl",
    errorHint: "apt-get install -y curl",
  },
  {
    check: isNodeInstalled,
    install: installNode,
    name: "Node.js",
    errorHint: "https://nodejs.org",
  },
  {
    check: isOpenClawInstalled,
    install: installOpenClaw,
    name: "OpenClaw",
    errorHint: "npm install -g openclaw@latest",
  },
];

const MAX_LOG_LINES = 6;

export function Prerequisites({ onComplete }: Props) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [failed, setFailed] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const updateTask = (index: number, update: Partial<Task>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
  };

  const addLog = (line: string) => {
    setLogs((prev) => [...prev.slice(-(MAX_LOG_LINES - 1)), line]);
  };

  useEffect(() => {
    if (started) return;
    setStarted(true);

    const run = async () => {
      for (let i = 0; i < INSTALLERS.length; i++) {
        const step = INSTALLERS[i];

        updateTask(i, { status: "active", label: `Checking ${step.name}...` });
        await new Promise((r) => setTimeout(r, 50));

        if (step.check()) {
          updateTask(i, { status: "done", label: step.name });
          continue;
        }

        // Need to install — check permissions
        if (!isRootOrSudo()) {
          updateTask(i, {
            status: "error",
            label: step.name,
            detail: "Run as root or with sudo",
          });
          setFailed("Re-run with: sudo ./foma-setup");
          return;
        }

        updateTask(i, { status: "active", label: `Installing ${step.name}...` });
        setLogs([]);

        const ok = await step.install(addLog);
        if (ok) {
          updateTask(i, { status: "done", label: `${step.name} installed` });
          setLogs([]);
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

      {logs.length > 0 && (
        <Box flexDirection="column" marginTop={0} paddingLeft={2}>
          {logs.map((line, i) => (
            <Text key={i} dimColor wrap="truncate">
              {line}
            </Text>
          ))}
        </Box>
      )}

      {failed && <Text color="red">{failed}</Text>}
    </Box>
  );
}
