import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { TaskList } from "../components/TaskList.js";
import { createWorkspaceDir, writeEnvFile, fetchTemplates, copyRootTemplates, fetchScripts, installScriptDeps, updateOpenClawConfig, } from "../lib/helpers.js";
import { OPENCLAW_DIR } from "../lib/constants.js";
import path from "path";
const INITIAL_TASKS = [
    { label: "Create directory structure", status: "pending" },
    { label: "Write environment config", status: "pending" },
    { label: "Fetch templates from GitHub", status: "pending" },
    { label: "Fetch scripts from GitHub", status: "pending" },
    { label: "Install script dependencies", status: "pending" },
    { label: "Update OpenClaw config", status: "pending" },
];
export function WorkspaceSetup({ address, privateKey, userId, onComplete }) {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [started, setStarted] = useState(false);
    const agentId = `foma-${userId}`;
    const workspaceName = `workspace-foma-${userId}`;
    const workspacePath = path.join(OPENCLAW_DIR, workspaceName);
    const updateTask = (index, update) => {
        setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
    };
    useEffect(() => {
        if (started)
            return;
        setStarted(true);
        const run = async () => {
            // 1. Create directory
            updateTask(0, { status: "active" });
            try {
                await createWorkspaceDir(workspacePath);
                updateTask(0, { status: "done" });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                updateTask(0, { status: "error", detail: msg });
                return;
            }
            // 2. Write .env
            updateTask(1, { status: "active" });
            try {
                await writeEnvFile(workspacePath, address, privateKey);
                updateTask(1, { status: "done" });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                updateTask(1, { status: "error", detail: msg });
                return;
            }
            // 3. Fetch templates
            updateTask(2, { status: "active" });
            try {
                const errors = await fetchTemplates(workspacePath, address, agentId);
                await copyRootTemplates(workspacePath);
                if (errors.length > 0) {
                    updateTask(2, { status: "done", detail: `${errors.length} warning(s)` });
                }
                else {
                    updateTask(2, { status: "done" });
                }
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                updateTask(2, { status: "error", detail: msg });
            }
            // 4. Fetch scripts
            updateTask(3, { status: "active" });
            try {
                const errors = await fetchScripts(workspacePath);
                if (errors.length > 0) {
                    updateTask(3, { status: "done", detail: `${errors.length} warning(s)` });
                }
                else {
                    updateTask(3, { status: "done" });
                }
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                updateTask(3, { status: "error", detail: msg });
            }
            // 5. Install deps
            updateTask(4, { status: "active" });
            try {
                await installScriptDeps(workspacePath);
                updateTask(4, { status: "done" });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                updateTask(4, { status: "done", detail: `skipped: ${msg}` });
            }
            // 6. Update openclaw.json
            updateTask(5, { status: "active" });
            try {
                await updateOpenClawConfig(agentId, workspacePath);
                updateTask(5, { status: "done" });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                updateTask(5, { status: "error", detail: msg });
                return;
            }
            // Done
            setTimeout(() => onComplete({ workspacePath, agentId }), 1000);
        };
        run();
    }, []);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, children: "Creating agent workspace..." }), _jsx(TaskList, { tasks: tasks })] }));
}
