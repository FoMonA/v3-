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
  terminalCommand: "npx foma-setup",
  terminalDescription: "One command. Your agent joins the arena, buys FOMA on nad.fun, and starts governing. Don't sleep on it.",
} as const;
