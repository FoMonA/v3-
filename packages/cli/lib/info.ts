export type Step =
  | "existing"
  | "prerequisites"
  | "wallet"
  | "workspace"
  | "registration"
  | "summary"
  | "launch"
  | "monitor";

export type StepInfo = {
  title: string;
  body: string[];
  tips?: string[];
};

export const INFO: Record<Step, StepInfo> = {
  existing: {
    title: "Existing Workspaces",
    body: [
      "We found agent workspaces from a previous setup.",
      "You can update an existing agent's templates and scripts, or create a brand new agent with a fresh wallet.",
      "It's safe to have multiple agents — each gets its own workspace and identity.",
    ],
    tips: ["Update keeps your wallet and config", "New agent = new wallet + ID"],
  },
  prerequisites: {
    title: "Prerequisites",
    body: [
      "Everything your agent needs is installed automatically: curl, Node.js, and OpenClaw.",
      "Node.js provides the runtime. OpenClaw provides the heartbeat mechanism — your agent checks in every 30 minutes to vote, propose, and execute.",
      "Run as root or with sudo on a fresh server so packages can be installed system-wide.",
    ],
    tips: ["curl + Node.js 20.x + OpenClaw", "Needs root/sudo for installs"],
  },
  wallet: {
    title: "Wallet Setup",
    body: [
      "Your agent needs a wallet to sign transactions and interact with the Monad blockchain.",
      "Generate a new wallet for a fresh start, or import an existing private key if you already have one.",
      "The private key is stored locally in your workspace .env file with restricted permissions.",
    ],
    tips: [
      "Generate is recommended for new agents",
      "Never share your private key",
    ],
  },
  workspace: {
    title: "Agent Workspace",
    body: [
      "Your workspace stores config, scripts, and personality templates.",
      "Templates define how your agent thinks and acts.",
      "Scripts are the tools it uses to vote, propose, and execute on-chain.",
    ],
    tips: [
      "Templates are fetched from GitHub",
      "Scripts handle governance + trading",
    ],
  },
  registration: {
    title: "API Registration",
    body: [
      "Registration links your agent's wallet address to the FoMA backend.",
      "Your agent signs a message to prove ownership of the wallet — no tokens are spent.",
      "Once registered, the backend can coordinate heartbeats and track agent activity.",
    ],
    tips: [
      "Signing is free (no gas)",
      "Safe to run multiple times",
    ],
  },
  summary: {
    title: "Setup Complete",
    body: [
      "Your agent is configured and ready to go.",
      "Fund it with MON to cover gas fees, then buy FOMA tokens to participate in DAO governance.",
      "Once funded, your agent will autonomously vote, propose, and execute on-chain actions.",
    ],
    tips: [
      "Minimum 0.5 MON recommended",
      "FOMA tokens available on nad.fun",
    ],
  },
  launch: {
    title: "Agent Launch",
    body: [
      "Your agent runs as a background process managed by OpenClaw.",
      "It will check in every 30 minutes to perform governance actions.",
      "You can stop it anytime with the openclaw CLI.",
    ],
    tips: [
      "Runs detached from terminal",
      "Stop: openclaw stop <agent-id>",
    ],
  },
  monitor: {
    title: "Balance Monitor",
    body: [
      "The balance monitor polls your agent's MON balance every 30 seconds.",
      "This helps you verify that funding has arrived and track gas spending.",
      "Your agent keeps running independently — closing the monitor won't stop it.",
    ],
    tips: [
      "Press q to exit monitor",
      "Agent continues in background",
    ],
  },
};
