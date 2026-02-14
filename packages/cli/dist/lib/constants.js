import path from "path";
import os from "os";
export const IS_TESTNET = process.argv.includes("--testnet");
export const NETWORK = IS_TESTNET
    ? {
        name: "Monad Testnet",
        rpc: "https://monad-testnet.drpc.org",
        chainId: 10143,
        currency: "MON",
        explorer: "https://testnet.monadexplorer.com",
    }
    : {
        name: "Monad Mainnet",
        rpc: "https://monad.drpc.org",
        chainId: 143,
        currency: "MON",
        explorer: "https://monadexplorer.com",
    };
export const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
export const OPENCLAW_JSON = path.join(OPENCLAW_DIR, "openclaw.json");
export const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/FoMonA/v3-/main/packages/cli";
export const TEMPLATE_FILES = [
    "templates/AGENTS.md",
    "templates/SOUL.md",
    "templates/HEARTBEAT.md",
    "templates/BOOTSTRAP.md",
    "templates/USER.md",
    "templates/references/CONSTITUTION.md",
    "templates/references/API.md",
    "templates/skills/governance/SKILL.md",
    "templates/skills/trading/SKILL.md",
    "templates/skills/betting/SKILL.md",
    "templates/scripts/package.json",
];
export const SCRIPT_FILES = [
    "scripts/lib/wallet.ts",
    "scripts/lib/contracts.ts",
    "scripts/lib/api.ts",
    "scripts/governance/propose.ts",
    "scripts/governance/vote.ts",
    "scripts/governance/execute.ts",
    "scripts/governance/check.ts",
    "scripts/trading/buy-token.ts",
    "scripts/trading/buy-foma.ts",
    "scripts/trading/sell-foma.ts",
    "scripts/trading/check-balance.ts",
    "scripts/betting/resolve.ts",
];
export const ROOT_TEMPLATES = {
    "templates/AGENTS.md": "AGENTS.md",
    "templates/SOUL.md": "SOUL.md",
    "templates/HEARTBEAT.md": "HEARTBEAT.md",
    "templates/BOOTSTRAP.md": "BOOTSTRAP.md",
    "templates/USER.md": "USER.md",
    "templates/references/CONSTITUTION.md": "references/CONSTITUTION.md",
    "templates/references/API.md": "references/API.md",
};
export const API_URL = "http://u00swgokgkso0ssgssoog0c4.89.167.58.81.sslip.io";
export const CONTRACT_ADDRESSES = {
    FOMA: "0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777",
    REGISTRY: "0x6782Ac490615F63BaAcED668A5fA4f4D3e250d6a",
    GOVERNOR: "0xb3EDdc787f22E188d3E30319df62cCb6f1bF4693",
    POOL: "0x8357034bF4A5B477709d90f3409C511F8Aa5Ec8C",
};
