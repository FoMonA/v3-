import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CHAIN, RPC_URL } from "./contracts.js";
// Load .env from workspace root (two levels up from scripts/lib/)
const __filename = fileURLToPath(import.meta.url);
const workspaceRoot = dirname(dirname(dirname(__filename)));
const envPath = join(workspaceRoot, ".env");
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1)
            continue;
        const key = trimmed.slice(0, eqIdx);
        const value = trimmed.slice(eqIdx + 1);
        // Always prefer .env file values over existing env vars
        // to ensure each agent uses its own workspace credentials
        process.env[key] = value;
    }
}
export function getPrivateKey() {
    const key = process.env.AGENT_PRIVATE_KEY;
    if (!key) {
        throw new Error("AGENT_PRIVATE_KEY not found in environment. " +
            `Checked .env at: ${envPath}`);
    }
    return key;
}
export function getAccount() {
    return privateKeyToAccount(getPrivateKey());
}
export function getAddress() {
    return getAccount().address;
}
export function getWalletClient() {
    return createWalletClient({
        account: getAccount(),
        chain: CHAIN,
        transport: http(RPC_URL),
    });
}
