import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { Select, Spinner, TextInput } from "@inkjs/ui";
import { Banner } from "./components/Banner.js";
import { Layout } from "./components/Layout.js";
import { TaskList } from "./components/TaskList.js";
import { BalanceMonitor } from "./steps/BalanceMonitor.js";
import { PROVIDERS } from "./steps/ApiKeySetup.js";
import { findWorkspaces, fetchTemplates, fetchScripts, copyRootTemplates, getWorkspaceEnv, setWorkspaceEnvVar, switchWorkspaceNetwork, generateUserId, updateOpenClawConfig, saveApiKey, stopGateway, startGateway, checkGatewayStatus, getExistingApiKey, getExistingModel, } from "./lib/helpers.js";
import { OPENCLAW_DIR, IS_TESTNET } from "./lib/constants.js";
import path from "path";
const INITIAL_TASKS = [
    { label: "Fetch templates", status: "pending" },
    { label: "Fetch scripts", status: "pending" },
    { label: "Copy root templates", status: "pending" },
    { label: "Update OpenClaw config", status: "pending" },
    { label: "Restart gateway", status: "pending" },
];
export function UpdateApp() {
    const [phase, setPhase] = useState("loading");
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState("");
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [agentAddress, setAgentAddress] = useState("");
    const [agentId, setAgentId] = useState("");
    const [minFoma, setMinFoma] = useState(50);
    const [workspaceNetwork, setWorkspaceNetwork] = useState(null);
    const { exit } = useApp();
    // Current config (loaded from existing setup)
    const [currentProvider, setCurrentProvider] = useState(null);
    const [currentModel, setCurrentModel] = useState(null);
    const [currentMaskedKey, setCurrentMaskedKey] = useState("");
    // Pending changes (null = keep existing)
    const [pendingModel, setPendingModel] = useState(null);
    const [pendingApiKey, setPendingApiKey] = useState(null);
    // Temp state for sub-flow provider selection
    const [changeProvider, setChangeProvider] = useState(null);
    // Config errors
    const [configError, setConfigError] = useState(null);
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
            }
            else {
                setPhase("select");
            }
        });
    }, []);
    const loadEnvAndConfig = async (workspace) => {
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
        }
        catch {
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
    const handleSelect = (value) => {
        setSelectedWorkspace(value);
        loadEnvAndConfig(value);
    };
    const updateTask = (index, update) => {
        setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)));
    };
    // Derive display values (pending overrides current)
    const displayModel = pendingModel ?? currentModel ?? "Not set";
    const displayProvider = (() => {
        if (pendingModel) {
            // Find provider from pending model string
            const p = PROVIDERS.find((prov) => prov.models.some((m) => m.value === pendingModel));
            if (p)
                return p.label.split("—")[0].trim();
        }
        if (pendingApiKey) {
            const p = PROVIDERS.find((prov) => prov.envVar === pendingApiKey.envVar);
            if (p)
                return p.label.split("—")[0].trim();
        }
        return currentProvider?.label.split("—")[0].trim() ?? "Not set";
    })();
    const displayKey = pendingApiKey
        ? `${pendingApiKey.apiKey.slice(0, 4)}...${pendingApiKey.apiKey.slice(-4)}`
        : currentMaskedKey || "Not set";
    useEffect(() => {
        if (phase !== "updating" || !selectedWorkspace)
            return;
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
            // 4. Update OpenClaw config (heartbeat interval, model etc.)
            updateTask(3, { status: "active" });
            try {
                const finalModel = pendingModel ?? currentModel ?? undefined;
                await updateOpenClawConfig(agentId, workspacePath, finalModel);
                updateTask(3, { status: "done" });
            }
            catch (err) {
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
            }
            else {
                updateTask(4, { status: "error", detail: "Gateway failed to start — run: openclaw gateway --force" });
            }
            setPhase("done");
            setTimeout(() => setPhase("dashboard"), 2000);
        };
        run();
    }, [phase, selectedWorkspace]);
    // Dashboard phase
    if (phase === "dashboard" && agentAddress) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Banner, {}), _jsx(BalanceMonitor, { address: agentAddress, agentId: agentId })] }));
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Banner, {}), _jsx(Layout, { step: "workspace", children: _jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Updating workspace..." }), phase === "loading" && _jsx(Spinner, { label: "Finding workspaces..." }), phase === "select" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Text, { children: "Which workspace do you want to update?" }), _jsx(Select, { options: workspaces.map((ws) => ({ label: ws, value: ws })), onChange: handleSelect })] })), phase === "network-switch" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Workspace: ", selectedWorkspace] }), _jsxs(Text, { color: "yellow", children: ["Network mismatch detected: workspace is on", " ", _jsx(Text, { bold: true, children: workspaceNetwork === "testnet" ? "Testnet" : "Mainnet" }), ", CLI is targeting", " ", _jsx(Text, { bold: true, children: IS_TESTNET ? "Testnet" : "Mainnet" }), "."] }), _jsx(Text, { children: "Would you like to switch the workspace network?" }), _jsx(Select, { options: IS_TESTNET
                                        ? [
                                            { label: "Switch to Testnet", value: "switch" },
                                            { label: `Keep ${workspaceNetwork === "testnet" ? "Testnet" : "Mainnet"}`, value: "keep" },
                                        ]
                                        : [
                                            { label: "Switch to Mainnet (recommended)", value: "switch" },
                                            { label: `Keep ${workspaceNetwork === "testnet" ? "Testnet" : "Mainnet"}`, value: "keep" },
                                        ], onChange: async (value) => {
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
                                    } })] })), phase === "menu" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Workspace: ", selectedWorkspace] }), _jsx(Text, { children: " " }), _jsx(Text, { bold: true, children: "Current Configuration:" }), _jsxs(Text, { children: ["  Provider: ", displayProvider] }), _jsxs(Text, { children: ["  Model:    ", displayModel] }), _jsxs(Text, { children: ["  Key:      ", displayKey] }), _jsxs(Text, { children: ["  Min FOMA: ", minFoma] }), _jsx(Text, { children: " " }), _jsx(Select, { options: [
                                        { label: "Change model", value: "model" },
                                        { label: "Change API key", value: "key" },
                                        { label: "Change min FOMA balance", value: "minfoma" },
                                        { label: "Continue with update →", value: "continue" },
                                    ], onChange: (value) => {
                                        if (value === "model")
                                            setPhase("change-model-provider");
                                        else if (value === "key")
                                            setPhase("change-key-provider");
                                        else if (value === "minfoma")
                                            setPhase("change-minfoma");
                                        else
                                            setPhase("updating");
                                    } })] })), phase === "change-model-provider" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Workspace: ", selectedWorkspace] }), _jsx(Text, { children: " " }), _jsx(Text, { children: "Which provider's models do you want to choose from?" }), _jsx(Select, { options: PROVIDERS.map((p) => ({ label: p.label, value: p.value })), onChange: (value) => {
                                        const provider = PROVIDERS.find((p) => p.value === value);
                                        setChangeProvider(provider);
                                        setPhase("change-model");
                                    } })] })), phase === "change-model" && changeProvider && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Workspace: ", selectedWorkspace] }), _jsxs(Text, { dimColor: true, children: ["Provider: ", changeProvider.label.split("—")[0].trim()] }), _jsx(Text, { children: " " }), _jsx(Text, { children: "Which model should your agent use?" }), _jsx(Select, { options: changeProvider.models, onChange: (value) => {
                                        setPendingModel(value);
                                        setChangeProvider(null);
                                        setPhase("menu");
                                    } })] })), phase === "change-key-provider" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Workspace: ", selectedWorkspace] }), _jsx(Text, { children: " " }), _jsx(Text, { children: "Which provider's API key do you want to set?" }), _jsx(Select, { options: PROVIDERS.map((p) => ({ label: p.label, value: p.value })), onChange: (value) => {
                                        const provider = PROVIDERS.find((p) => p.value === value);
                                        setChangeProvider(provider);
                                        setPhase("change-key");
                                    } })] })), phase === "change-key" && changeProvider && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Workspace: ", selectedWorkspace] }), _jsxs(Text, { dimColor: true, children: ["Provider: ", changeProvider.label.split("—")[0].trim()] }), _jsx(Text, { children: " " }), _jsxs(Text, { children: ["Enter your ", changeProvider.label.split(" ")[0], " API key:"] }), _jsxs(Text, { dimColor: true, children: ["Format: ", changeProvider.hint] }), _jsx(TextInput, { placeholder: changeProvider.hint, onSubmit: (value) => {
                                        const trimmed = value.trim();
                                        if (!trimmed)
                                            return;
                                        setPendingApiKey({ envVar: changeProvider.envVar, apiKey: trimmed });
                                        setChangeProvider(null);
                                        setPhase("menu");
                                    } })] })), phase === "change-minfoma" && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Workspace: ", selectedWorkspace] }), _jsx(Text, { children: " " }), _jsx(Text, { children: "Minimum FOMA balance to maintain?" }), _jsx(Text, { dimColor: true, children: "Your agent auto-buys FOMA when below this threshold." }), _jsx(TextInput, { defaultValue: String(minFoma), onSubmit: (value) => {
                                        const num = parseInt(value.trim(), 10);
                                        if (isNaN(num) || num < 0) {
                                            setConfigError("Enter a valid number (e.g. 50)");
                                            return;
                                        }
                                        setConfigError(null);
                                        setMinFoma(num);
                                        setPhase("menu");
                                    } }), configError && _jsx(Text, { color: "red", children: configError })] })), (phase === "updating" || phase === "done") && (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Workspace: ", selectedWorkspace] }), _jsxs(Text, { dimColor: true, children: ["Model: ", pendingModel ?? currentModel ?? "default"] }), _jsxs(Text, { dimColor: true, children: ["Min FOMA: ", minFoma] }), _jsx(TaskList, { tasks: tasks }), phase === "done" && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: "green", children: ["\u2713 Agent ", selectedWorkspace.replace("workspace-", ""), " restarted \u2014 loading dashboard..."] }) }))] })), phase === "done" && workspaces.length === 0 && (_jsx(Text, { color: "red", children: "No FoMA workspaces found. Run setup first." }))] }) })] }));
}
