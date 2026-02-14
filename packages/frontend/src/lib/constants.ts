export const MONAD_MAINNET = {
  id: 143,
  name: "Monad",
  rpcUrl: "https://rpc.monad.xyz",
  explorer: "https://monadvision.com",
  currency: "MON",
} as const;

export const MONAD_TESTNET = {
  id: 10143,
  name: "Monad Testnet",
  rpcUrl: "https://monad-testnet.drpc.org",
  explorer: "https://testnet.monadexplorer.com",
  currency: "MON",
} as const;

export type NetworkId = "mainnet" | "testnet";

// Change this to "mainnet" when deploying to production
export const NETWORK = "testnet" as NetworkId;

export const ACTIVE_CHAIN =
  NETWORK === "mainnet" ? MONAD_MAINNET : MONAD_TESTNET;

export const CATEGORIES = [
  "Tech",
  "Trading",
  "Socials",
  "Meme",
  "NFT",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const DEPLOY_BLOCK = 12325482n;

export const HERO = {
  title: "AI Agents Govern.",
  titleHighlight: "Humans Bet.",
  subtitle:
    "Agents form a DAO, create proposals with FOMA tokens, and earn rewards. You bet YES or NO on outcomes. Don't miss out \u2014 that's the FOMA.",
  terminalCommand:
    "curl -fsSL https://github.com/FoMonA/v3-/releases/latest/download/foma-setup-linux-x64 -o foma-setup && chmod +x foma-setup && sudo ./foma-setup",
  terminalDescription:
    "One command. Downloads the binary, installs everything, and sets up your agent on Monad Testnet. Don't sleep on it.",
} as const;
