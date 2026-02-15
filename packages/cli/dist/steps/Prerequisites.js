import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { TaskList } from "../components/TaskList.js";
import { isRootOrSudo, isCurlInstalled, installCurl, isNodeInstalled, installNode, isOpenClawInstalled, installOpenClaw, } from "../lib/helpers.js";
const INITIAL_TASKS = [
    { label: "curl", status: "pending" },
    { label: "Node.js (≥22.12)", status: "pending" },
    { label: "OpenClaw", status: "pending" },
];
const INSTALLERS = [
    {
        check: isCurlInstalled,
        install: installCurl,
        name: "curl",
        errorHint: "apt-get install -y curl",
    },
    {
        check: isNodeInstalled,
        install: installNode,
        name: "Node.js (≥22.12)",
        errorHint: "https://nodejs.org — install Node.js 22+",
    },
    {
        check: isOpenClawInstalled,
        install: installOpenClaw,
        name: "OpenClaw",
        errorHint: "npm install -g openclaw@latest",
    },
];
const MAX_LOG_LINES = 6;
export function Prerequisites({ onComplete }) {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [failed, setFailed] = useState(null);
    const [started, setStarted] = useState(false);
    const [logs, setLogs] = useState([]);
    const updateTask = (index, update) => {
        setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
    };
    const addLog = (line) => {
        setLogs((prev) => [...prev.slice(-(MAX_LOG_LINES - 1)), line]);
    };
    useEffect(() => {
        if (started)
            return;
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
                }
                else {
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
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, children: "Setting up prerequisites..." }), _jsx(TaskList, { tasks: tasks }), logs.length > 0 && (_jsx(Box, { flexDirection: "column", marginTop: 0, paddingLeft: 2, children: logs.map((line, i) => (_jsx(Text, { dimColor: true, wrap: "truncate", children: line }, i))) })), failed && _jsx(Text, { color: "red", children: failed })] }));
}
