import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, useApp } from "ink";
import { Banner } from "./components/Banner.js";
import { StepProgress } from "./components/StepProgress.js";
import { Layout } from "./components/Layout.js";
import { ExistingWorkspace } from "./steps/ExistingWorkspace.js";
import { Prerequisites } from "./steps/Prerequisites.js";
import { ApiKeySetup } from "./steps/ApiKeySetup.js";
import { WalletSetup } from "./steps/WalletSetup.js";
import { WorkspaceSetup } from "./steps/WorkspaceSetup.js";
import { Registration } from "./steps/Registration.js";
import { Summary } from "./steps/Summary.js";
import { AgentLaunch } from "./steps/AgentLaunch.js";
import { BalanceMonitor } from "./steps/BalanceMonitor.js";
import { findWorkspaces, getWorkspaceEnv, saveApiKey } from "./lib/helpers.js";
import { OPENCLAW_DIR } from "./lib/constants.js";
import path from "path";
export function App({ onSwitchToUpdate }) {
    const [currentStep, setCurrentStep] = useState("prerequisites");
    const [setupData, setSetupData] = useState({});
    const [existingWorkspaces, setExistingWorkspaces] = useState([]);
    const [workspaceNetworks, setWorkspaceNetworks] = useState({});
    const [loading, setLoading] = useState(true);
    const { exit } = useApp();
    useEffect(() => {
        findWorkspaces().then(async (workspaces) => {
            if (workspaces.length > 0) {
                setExistingWorkspaces(workspaces);
                // Load network info for each workspace
                const networks = {};
                for (const ws of workspaces) {
                    try {
                        const env = await getWorkspaceEnv(path.join(OPENCLAW_DIR, ws));
                        networks[ws] = env.NETWORK || "testnet";
                    }
                    catch {
                        // Skip if env can't be read
                    }
                }
                setWorkspaceNetworks(networks);
                setCurrentStep("existing");
            }
            setLoading(false);
        });
    }, []);
    if (loading)
        return null;
    const renderStep = () => {
        switch (currentStep) {
            case "existing":
                return (_jsx(ExistingWorkspace, { workspaces: existingWorkspaces, workspaceNetworks: workspaceNetworks, onUpdate: () => onSwitchToUpdate?.(), onNew: () => setCurrentStep("prerequisites"), onCancel: () => exit() }));
            case "prerequisites":
                return (_jsx(Prerequisites, { onComplete: () => setCurrentStep("apikey") }));
            case "apikey":
                return (_jsx(ApiKeySetup, { onComplete: async (data) => {
                        if (data.apiKey) {
                            await saveApiKey(data.envVar, data.apiKey);
                        }
                        setSetupData((prev) => ({ ...prev, apiKey: data }));
                        setCurrentStep("wallet");
                    } }));
            case "wallet":
                return (_jsx(WalletSetup, { onComplete: (walletData) => {
                        setSetupData((prev) => ({ ...prev, wallet: walletData }));
                        setCurrentStep("workspace");
                    } }));
            case "workspace":
                return (_jsx(WorkspaceSetup, { address: setupData.wallet.address, privateKey: setupData.wallet.privateKey, userId: setupData.wallet.userId, minFoma: setupData.wallet.minFoma, model: setupData.apiKey?.model, onComplete: (wsData) => {
                        setSetupData((prev) => ({
                            ...prev,
                            workspace: { path: wsData.workspacePath, agentId: wsData.agentId },
                        }));
                        setCurrentStep("registration");
                    } }));
            case "registration":
                return (_jsx(Registration, { address: setupData.wallet.address, privateKey: setupData.wallet.privateKey, onComplete: () => {
                        setSetupData((prev) => ({ ...prev, registered: true }));
                        setCurrentStep("summary");
                    } }));
            case "summary":
                return (_jsx(Summary, { agentId: setupData.workspace.agentId, address: setupData.wallet.address, workspacePath: setupData.workspace.path, onLaunch: (start) => {
                        if (start) {
                            setSetupData((prev) => ({ ...prev, agentStarted: true }));
                            setCurrentStep("launch");
                        }
                        else {
                            exit();
                        }
                    } }));
            case "launch":
                return (_jsx(AgentLaunch, { agentId: setupData.workspace.agentId, onComplete: () => setCurrentStep("monitor") }));
            case "monitor":
                return (_jsx(BalanceMonitor, { address: setupData.wallet.address, agentId: setupData.workspace.agentId }));
            default:
                return null;
        }
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Banner, {}), _jsx(StepProgress, { currentStep: currentStep }), _jsx(Layout, { step: currentStep, children: renderStep() })] }));
}
