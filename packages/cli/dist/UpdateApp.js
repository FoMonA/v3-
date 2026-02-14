import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { Select, Spinner } from "@inkjs/ui";
import { Banner } from "./components/Banner.js";
import { Layout } from "./components/Layout.js";
import { TaskList } from "./components/TaskList.js";
import { findWorkspaces, fetchTemplates, fetchScripts, copyRootTemplates, getWorkspaceEnv, generateUserId, stopAgent, startAgent, } from "./lib/helpers.js";
import { OPENCLAW_DIR } from "./lib/constants.js";
import path from "path";
const INITIAL_TASKS = [
    { label: "Fetch templates", status: "pending" },
    { label: "Fetch scripts", status: "pending" },
    { label: "Copy root templates", status: "pending" },
    { label: "Restart agent", status: "pending" },
];
export function UpdateApp() {
    const [phase, setPhase] = useState("loading");
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState("");
    const [tasks, setTasks] = useState(INITIAL_TASKS);
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
            }
            else {
                setPhase("select");
            }
        });
    }, []);
    const updateTask = (index, update) => {
        setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
    };
    useEffect(() => {
        if (phase !== "updating" || !selectedWorkspace)
            return;
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
            }
            catch {
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
            }
            catch (err) {
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
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                updateTask(1, { status: "error", detail: msg });
            }
            // 3. Copy root templates
            updateTask(2, { status: "active" });
            try {
                await copyRootTemplates(workspacePath);
                updateTask(2, { status: "done" });
            }
            catch (err) {
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
    const handleSelect = (value) => {
        setSelectedWorkspace(value);
        setPhase("updating");
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Banner, {}), _jsx(Layout, { step: "workspace", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Updating workspace..." }), phase === "loading" && _jsx(Spinner, { label: "Finding workspaces..." }), phase === "select" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: "Which workspace do you want to update?" }), _jsx(Select, { options: workspaces.map((ws) => ({ label: ws, value: ws })), onChange: handleSelect })] })), (phase === "updating" || phase === "done") && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Workspace: ", selectedWorkspace] }), _jsx(TaskList, { tasks: tasks }), phase === "done" && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "green", children: ["\u2713 Agent ", selectedWorkspace.replace("workspace-", ""), " restarted with updated files"] }) }))] })), phase === "done" && workspaces.length === 0 && (_jsx(Text, { color: "red", children: "No FoMA workspaces found. Run setup first." }))] }) })] }));
}
