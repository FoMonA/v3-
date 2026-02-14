import React, { useState, useEffect } from "react";
import { Box, useApp } from "ink";
import { Banner } from "./components/Banner.js";
import { StepProgress } from "./components/StepProgress.js";
import { Layout } from "./components/Layout.js";
import { ExistingWorkspace } from "./steps/ExistingWorkspace.js";
import { Prerequisites } from "./steps/Prerequisites.js";
import { ApiKeySetup, type ApiKeyData } from "./steps/ApiKeySetup.js";
import { WalletSetup } from "./steps/WalletSetup.js";
import { WorkspaceSetup } from "./steps/WorkspaceSetup.js";
import { Registration } from "./steps/Registration.js";
import { Summary } from "./steps/Summary.js";
import { AgentLaunch } from "./steps/AgentLaunch.js";
import { BalanceMonitor } from "./steps/BalanceMonitor.js";
import { findWorkspaces, saveApiKey } from "./lib/helpers.js";
import type { Step } from "./lib/info.js";

type SetupData = {
  wallet?: { address: string; privateKey: string; userId: string; minFoma: number };
  apiKey?: ApiKeyData;
  workspace?: { path: string; agentId: string };
  registered?: boolean;
  agentStarted?: boolean;
};

type Props = {
  onSwitchToUpdate?: () => void;
};

export function App({ onSwitchToUpdate }: Props) {
  const [currentStep, setCurrentStep] = useState<Step>("prerequisites");
  const [setupData, setSetupData] = useState<SetupData>({});
  const [existingWorkspaces, setExistingWorkspaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { exit } = useApp();

  useEffect(() => {
    findWorkspaces().then((workspaces) => {
      if (workspaces.length > 0) {
        setExistingWorkspaces(workspaces);
        setCurrentStep("existing");
      }
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  const renderStep = () => {
    switch (currentStep) {
      case "existing":
        return (
          <ExistingWorkspace
            workspaces={existingWorkspaces}
            onUpdate={() => onSwitchToUpdate?.()}
            onNew={() => setCurrentStep("prerequisites")}
            onCancel={() => exit()}
          />
        );

      case "prerequisites":
        return (
          <Prerequisites onComplete={() => setCurrentStep("apikey")} />
        );

      case "apikey":
        return (
          <ApiKeySetup
            onComplete={async (data) => {
              await saveApiKey(data.envVar, data.apiKey);
              setSetupData((prev) => ({ ...prev, apiKey: data }));
              setCurrentStep("wallet");
            }}
          />
        );

      case "wallet":
        return (
          <WalletSetup
            onComplete={(walletData) => {
              setSetupData((prev) => ({ ...prev, wallet: walletData }));
              setCurrentStep("workspace");
            }}
          />
        );

      case "workspace":
        return (
          <WorkspaceSetup
            address={setupData.wallet!.address}
            privateKey={setupData.wallet!.privateKey}
            userId={setupData.wallet!.userId}
            minFoma={setupData.wallet!.minFoma}
            model={setupData.apiKey?.model}
            onComplete={(wsData) => {
              setSetupData((prev) => ({
                ...prev,
                workspace: { path: wsData.workspacePath, agentId: wsData.agentId },
              }));
              setCurrentStep("registration");
            }}
          />
        );

      case "registration":
        return (
          <Registration
            address={setupData.wallet!.address}
            privateKey={setupData.wallet!.privateKey}
            onComplete={() => {
              setSetupData((prev) => ({ ...prev, registered: true }));
              setCurrentStep("summary");
            }}
          />
        );

      case "summary":
        return (
          <Summary
            agentId={setupData.workspace!.agentId}
            address={setupData.wallet!.address}
            workspacePath={setupData.workspace!.path}
            onLaunch={(start) => {
              if (start) {
                setSetupData((prev) => ({ ...prev, agentStarted: true }));
                setCurrentStep("launch");
              } else {
                exit();
              }
            }}
          />
        );

      case "launch":
        return (
          <AgentLaunch
            agentId={setupData.workspace!.agentId}
            onComplete={() => setCurrentStep("monitor")}
          />
        );

      case "monitor":
        return (
          <BalanceMonitor
            address={setupData.wallet!.address}
            agentId={setupData.workspace!.agentId}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column">
      <Banner />
      <StepProgress currentStep={currentStep} />
      <Layout step={currentStep}>{renderStep()}</Layout>
    </Box>
  );
}
