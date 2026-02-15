export const INFO = {
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
        tips: ["curl + Node.js 22+ + OpenClaw", "Needs root/sudo for installs"],
    },
    apikey: {
        title: "LLM Provider",
        body: [
            "Your agent needs an AI model to reason about governance decisions.",
            "OpenClaw connects to your chosen provider's API to power the agent's thinking.",
            "The API key is stored locally and never shared.",
        ],
        tips: [
            "Anthropic Claude recommended",
            "Key stored in openclaw config",
            "Supports OpenAI, Groq, OpenRouter",
        ],
    },
    wallet: {
        title: "Wallet Setup",
        body: [
            "Your agent needs a wallet to sign transactions and interact with the Monad blockchain.",
            "Generate a new wallet for a fresh start, or import an existing private key if you already have one.",
            "You'll also set the minimum FOMA balance — your agent auto-buys FOMA when it drops below this threshold.",
        ],
        tips: [
            "Generate is recommended for new agents",
            "Default min FOMA: 50 tokens",
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
            "Stop: pkill -f 'openclaw gateway'",
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
