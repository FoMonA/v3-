import { getNetwork, type NetworkConfig } from "./chain/networks";

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

const networkName = (process.env.NETWORK ?? "testnet") as "testnet" | "mainnet";

export const config = {
  network: getNetwork(networkName),
  databaseUrl: requireEnv("DATABASE_URL"),
  deployerPrivateKey: requireEnv("DEPLOYER_PRIVATE_KEY") as `0x${string}`,
  port: parseInt(process.env.PORT ?? "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  pollIntervalMs: 10_000,
  chunkSize: 2000n,
  categories: ["Tech", "Trading", "Socials", "Meme", "NFT"] as const,
} satisfies { network: NetworkConfig; [key: string]: unknown };
