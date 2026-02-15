import { ethers } from "ethers";
import fs from "node:fs/promises";
import path from "path";
import { execSync, spawn } from "child_process";
import crypto from "crypto";
import { privateKeyToAccount } from "viem/accounts";
import { OPENCLAW_DIR, OPENCLAW_JSON, GITHUB_RAW_BASE, TEMPLATE_FILES, SCRIPT_FILES, ROOT_TEMPLATES, API_URL, CONTRACT_ADDRESSES, TESTNET_CONTRACT_ADDRESSES, MAINNET_CONTRACT_ADDRESSES, NETWORK, IS_TESTNET, } from "./constants.js";
export function generateUserId(address) {
    return crypto
        .createHash("sha256")
        .update(address.toLowerCase())
        .digest("hex")
        .slice(0, 8);
}
function hasBin(name) {
    try {
        execSync(`which ${name}`, { stdio: "ignore" });
        return true;
    }
    catch {
        return false;
    }
}
/** Prefix command with sudo when not already root */
function sudo(cmd) {
    return process.getuid?.() === 0 ? cmd : `sudo ${cmd}`;
}
/** Detect the system package manager */
function pkgManager() {
    if (hasBin("apt-get"))
        return "apt";
    if (hasBin("dnf"))
        return "dnf";
    if (hasBin("yum"))
        return "yum";
    return null;
}
/** Run a shell command async, streaming output to onLog */
function runAsync(cmd, onLog) {
    return new Promise((resolve) => {
        const child = spawn("bash", ["-c", cmd], {
            stdio: "pipe",
            env: {
                ...process.env,
                DEBIAN_FRONTEND: "noninteractive",
                NEEDRESTART_MODE: "a",
                NEEDRESTART_SUSPEND: "1",
            },
        });
        const handleData = (data) => {
            const lines = data.toString().split("\n").filter(Boolean);
            for (const line of lines) {
                onLog?.(line);
            }
        };
        child.stdout?.on("data", handleData);
        child.stderr?.on("data", handleData);
        child.on("close", (code) => resolve(code === 0));
        child.on("error", () => resolve(false));
    });
}
export function isRootOrSudo() {
    if (process.getuid?.() === 0)
        return true;
    return hasBin("sudo");
}
// ─── curl ───────────────────────────────────────────────────────────────────
export function isCurlInstalled() {
    return hasBin("curl");
}
export async function installCurl(onLog) {
    const pm = pkgManager();
    if (!pm)
        return false;
    const cmd = pm === "apt"
        ? "apt-get update -y && apt-get install -y curl"
        : `${pm} install -y curl`;
    return runAsync(sudo(cmd), onLog);
}
// ─── Node.js ────────────────────────────────────────────────────────────────
export function isNodeInstalled() {
    if (!hasBin("node"))
        return false;
    try {
        const version = execSync("node --version", { encoding: "utf-8" }).trim();
        const match = version.match(/^v(\d+)\.(\d+)/);
        if (!match)
            return false;
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        return major > 22 || (major === 22 && minor >= 12);
    }
    catch {
        return false;
    }
}
export async function installNode(onLog) {
    const pm = pkgManager();
    if (!pm)
        return false;
    if (pm === "apt") {
        const setupOk = await runAsync(sudo("bash -c 'curl -fsSL https://deb.nodesource.com/setup_22.x | bash -'"), onLog);
        if (!setupOk)
            return false;
        return runAsync(sudo("apt-get install -y nodejs"), onLog);
    }
    else {
        const setupOk = await runAsync(sudo(`bash -c 'curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -'`), onLog);
        if (!setupOk)
            return false;
        return runAsync(sudo(`${pm} install -y nodejs`), onLog);
    }
}
// ─── OpenClaw ───────────────────────────────────────────────────────────────
export function isOpenClawInstalled() {
    return hasBin("openclaw");
}
export async function installOpenClaw(onLog) {
    return runAsync(sudo("npm install -g openclaw@latest"), onLog);
}
export function isValidPrivateKey(key) {
    try {
        const hex = key.startsWith("0x") ? key : `0x${key}`;
        if (!/^0x[0-9a-fA-F]{64}$/.test(hex))
            return false;
        new ethers.Wallet(hex);
        return true;
    }
    catch {
        return false;
    }
}
export async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}
export async function fetchFileFromGitHub(relativePath, destPath, replacements) {
    const url = `${GITHUB_RAW_BASE}/${relativePath}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${relativePath}: ${res.status} ${res.statusText}`);
    }
    let content = await res.text();
    if (replacements) {
        for (const [placeholder, value] of Object.entries(replacements)) {
            content = content.replaceAll(placeholder, value);
        }
    }
    await ensureDir(path.dirname(destPath));
    await fs.writeFile(destPath, content, "utf-8");
}
export async function readJsonFile(filePath) {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
}
export async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function findWorkspaces() {
    if (!(await pathExists(OPENCLAW_DIR)))
        return [];
    try {
        const entries = await fs.readdir(OPENCLAW_DIR);
        return entries.filter((e) => e.startsWith("workspace-foma-"));
    }
    catch {
        return [];
    }
}
export function generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    return { address: wallet.address, privateKey: wallet.privateKey };
}
export function importWallet(key) {
    const hex = key.startsWith("0x") ? key : `0x${key}`;
    const wallet = new ethers.Wallet(hex);
    return { address: wallet.address, privateKey: wallet.privateKey };
}
export async function writeEnvFile(workspacePath, address, privateKey, minFoma = 50) {
    const envContent = `AGENT_PRIVATE_KEY=${privateKey}
AGENT_ADDRESS=${address}
NETWORK=${IS_TESTNET ? "testnet" : "mainnet"}
RPC_URL=${NETWORK.rpc}
FOMA_API_URL=${API_URL}
FOMA_ADDR=${CONTRACT_ADDRESSES.FOMA}
REGISTRY_ADDR=${CONTRACT_ADDRESSES.REGISTRY}
GOVERNOR_ADDR=${CONTRACT_ADDRESSES.GOVERNOR}
POOL_ADDR=${CONTRACT_ADDRESSES.POOL}
MIN_FOMA_BALANCE=${minFoma}
`;
    await fs.writeFile(path.join(workspacePath, ".env"), envContent, {
        mode: 0o600,
    });
}
export async function createWorkspaceDir(workspacePath) {
    await ensureDir(workspacePath);
    await ensureDir(path.join(workspacePath, "scripts"));
    await ensureDir(path.join(workspacePath, "references"));
}
export async function fetchTemplates(workspacePath, address, agentId, minFoma = 50) {
    const replacements = {
        "{{AGENT_ADDRESS}}": address,
        "{{AGENT_ID}}": agentId,
        "{{MIN_FOMA_BALANCE}}": String(minFoma),
    };
    const errors = [];
    for (const file of TEMPLATE_FILES) {
        try {
            const dest = path.join(workspacePath, file);
            await fetchFileFromGitHub(file, dest, replacements);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${file}: ${msg}`);
        }
    }
    return errors;
}
export async function copyRootTemplates(workspacePath) {
    for (const [src, dest] of Object.entries(ROOT_TEMPLATES)) {
        const srcPath = path.join(workspacePath, src);
        const destPath = path.join(workspacePath, dest);
        try {
            await ensureDir(path.dirname(destPath));
            await fs.copyFile(srcPath, destPath);
        }
        catch {
            // Source wasn't fetched, skip
        }
    }
}
export async function fetchScripts(workspacePath) {
    const errors = [];
    for (const file of SCRIPT_FILES) {
        try {
            const dest = path.join(workspacePath, file);
            await fetchFileFromGitHub(file, dest);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${file}: ${msg}`);
        }
    }
    return errors;
}
export async function installScriptDeps(workspacePath) {
    const scriptsPkgSrc = path.join(workspacePath, "templates/scripts/package.json");
    const scriptsPkgDest = path.join(workspacePath, "scripts/package.json");
    await fs.copyFile(scriptsPkgSrc, scriptsPkgDest);
    execSync("npm install --production", {
        cwd: path.join(workspacePath, "scripts"),
        stdio: "pipe",
    });
}
export async function updateOpenClawConfig(agentId, workspacePath, model) {
    await ensureDir(OPENCLAW_DIR);
    let config = {};
    if (await pathExists(OPENCLAW_JSON)) {
        try {
            config = await readJsonFile(OPENCLAW_JSON);
        }
        catch {
            config = {};
        }
    }
    const agents = config.agents;
    if (!agents) {
        config.agents = { list: [] };
    }
    const agentsList = config.agents.list;
    if (!agentsList) {
        config.agents.list = [];
    }
    // Ensure gateway is configured for local mode with auth
    if (!config.gateway) {
        config.gateway = {};
    }
    const gw = config.gateway;
    gw.mode = "local";
    if (!gw.auth) {
        gw.auth = { token: crypto.randomBytes(16).toString("hex") };
    }
    // Remove existing entry for this agent if re-running
    config.agents.list = config.agents.list.filter((a) => a.id !== agentId);
    const agentEntry = {
        id: agentId,
        name: "FoMA Agent",
        workspace: workspacePath,
        heartbeat: { every: IS_TESTNET ? "1m" : "30m", target: "last" },
    };
    if (model) {
        agentEntry.model = model;
    }
    config.agents.list.push(agentEntry);
    await fs.writeFile(OPENCLAW_JSON, JSON.stringify(config, null, 2), "utf-8");
}
export async function registerWithApi(address, privateKey) {
    try {
        const viemAccount = privateKeyToAccount(privateKey);
        const timestamp = Math.floor(Date.now() / 1000);
        const regMessage = `Register agent ${address} for FoMA at timestamp ${timestamp}`;
        const regSignature = await viemAccount.signMessage({ message: regMessage });
        const regRes = await fetch(`${API_URL}/api/agents/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                address,
                message: regMessage,
                signature: regSignature,
            }),
        });
        if (regRes.ok) {
            return { status: "ok", message: "Registered successfully!" };
        }
        else if (regRes.status === 409) {
            return { status: "exists", message: "Already registered." };
        }
        else {
            const body = await regRes.text();
            return { status: "error", message: `Registration failed (${regRes.status}): ${body}` };
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { status: "error", message: `Registration deferred: ${msg}` };
    }
}
const API_KEY_ENV_VARS = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "GROQ_API_KEY",
    "OPENROUTER_API_KEY",
];
export async function getExistingApiKey() {
    const envFile = path.join(OPENCLAW_DIR, ".env");
    let content;
    try {
        content = await fs.readFile(envFile, "utf-8");
    }
    catch {
        return null;
    }
    for (const envVar of API_KEY_ENV_VARS) {
        const match = content.match(new RegExp(`^${envVar}=(.+)$`, "m"));
        if (match && match[1].trim()) {
            const key = match[1].trim();
            const masked = key.length > 8
                ? key.slice(0, 4) + "..." + key.slice(-4)
                : "****";
            return { envVar, maskedKey: masked };
        }
    }
    return null;
}
export async function getExistingModel() {
    if (!(await pathExists(OPENCLAW_JSON)))
        return null;
    try {
        const config = await readJsonFile(OPENCLAW_JSON);
        const agents = config.agents;
        const firstAgent = agents?.list?.[0];
        return firstAgent?.model ?? null;
    }
    catch {
        return null;
    }
}
export async function saveApiKey(envVar, apiKey) {
    const envFile = path.join(OPENCLAW_DIR, ".env");
    await ensureDir(OPENCLAW_DIR);
    let content = "";
    try {
        content = await fs.readFile(envFile, "utf-8");
    }
    catch {
        // File doesn't exist yet
    }
    const regex = new RegExp(`^${envVar}=.*$`, "m");
    if (regex.test(content)) {
        content = content.replace(regex, `${envVar}=${apiKey}`);
    }
    else {
        content = content.trimEnd() + `\n${envVar}=${apiKey}\n`;
    }
    await fs.writeFile(envFile, content, { mode: 0o600 });
}
export function startGateway() {
    // Read the openclaw .env to pass API keys to the gateway process
    let extraEnv = {};
    try {
        const envFile = path.join(OPENCLAW_DIR, ".env");
        const content = require("fs").readFileSync(envFile, "utf-8");
        for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#"))
                continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx === -1)
                continue;
            extraEnv[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
        }
    }
    catch {
        // No .env file
    }
    const child = spawn("openclaw", ["gateway", "--force"], {
        detached: true,
        stdio: "ignore",
        env: { ...process.env, ...extraEnv },
    });
    child.unref();
}
export function stopGateway() {
    try {
        execSync("pkill -f 'openclaw gateway'", { stdio: "ignore" });
        return true;
    }
    catch {
        return false;
    }
}
export async function checkGatewayStatus() {
    return new Promise((resolve) => {
        const child = spawn("openclaw", ["health"], { stdio: "pipe", timeout: 5000 });
        let output = "";
        child.stdout?.on("data", (d) => { output += d.toString(); });
        child.on("close", (code) => resolve(code === 0 ? "running" : "stopped"));
        child.on("error", () => resolve("stopped"));
    });
}
export function triggerHeartbeat(agentId, delaySec = 180) {
    // Schedule the first heartbeat after a delay (default 3 min) so the gateway
    // is fully settled before the agent runs. Uses a detached shell so it
    // survives even if the CLI exits.
    const cmd = `sleep ${delaySec} && openclaw agent --agent ${agentId} --message heartbeat --channel last`;
    const child = spawn("bash", ["-c", cmd], {
        detached: true,
        stdio: "ignore",
    });
    child.unref();
}
// Legacy aliases
export function startAgent(_agentId) {
    startGateway();
}
export function stopAgent(_agentId) {
    return stopGateway();
}
export async function getMonBalance(address) {
    const provider = new ethers.JsonRpcProvider(NETWORK.rpc);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
}
const ERC20_BALANCE_ABI = [
    {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
];
export async function getFomaBalance(address) {
    const { createPublicClient, http, formatUnits } = await import("viem");
    const { monadTestnet } = await import("viem/chains");
    const client = createPublicClient({
        chain: IS_TESTNET ? monadTestnet : monadTestnet, // TODO: add mainnet chain
        transport: http(NETWORK.rpc),
    });
    const balance = await client.readContract({
        address: CONTRACT_ADDRESSES.FOMA,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [address],
    });
    return formatUnits(balance, 18);
}
export async function getWorkspaceEnv(workspacePath) {
    const envPath = path.join(workspacePath, ".env");
    const envContent = await fs.readFile(envPath, "utf-8");
    const vars = {};
    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1)
            continue;
        vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
    return vars;
}
export async function setWorkspaceEnvVar(workspacePath, key, value) {
    const envPath = path.join(workspacePath, ".env");
    let content = await fs.readFile(envPath, "utf-8");
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
    }
    else {
        content = content.trimEnd() + `\n${key}=${value}\n`;
    }
    await fs.writeFile(envPath, content, { mode: 0o600 });
}
export async function switchWorkspaceNetwork(workspacePath, toTestnet) {
    const addrs = toTestnet ? TESTNET_CONTRACT_ADDRESSES : MAINNET_CONTRACT_ADDRESSES;
    const rpc = toTestnet
        ? "https://monad-testnet.drpc.org"
        : "https://monad.drpc.org";
    const apiUrl = toTestnet
        ? "https://api-testnet.impressionant.com"
        : "https://api-mainnet.impressionant.com";
    await setWorkspaceEnvVar(workspacePath, "NETWORK", toTestnet ? "testnet" : "mainnet");
    await setWorkspaceEnvVar(workspacePath, "RPC_URL", rpc);
    await setWorkspaceEnvVar(workspacePath, "FOMA_API_URL", apiUrl);
    await setWorkspaceEnvVar(workspacePath, "FOMA_ADDR", addrs.FOMA);
    await setWorkspaceEnvVar(workspacePath, "REGISTRY_ADDR", addrs.REGISTRY);
    await setWorkspaceEnvVar(workspacePath, "GOVERNOR_ADDR", addrs.GOVERNOR);
    await setWorkspaceEnvVar(workspacePath, "POOL_ADDR", addrs.POOL);
}
