import { ethers } from "ethers";
import fs from "node:fs/promises";
import path from "path";
import { execSync, spawn } from "child_process";
import crypto from "crypto";
import { privateKeyToAccount } from "viem/accounts";
import {
  OPENCLAW_DIR,
  OPENCLAW_JSON,
  GITHUB_RAW_BASE,
  TEMPLATE_FILES,
  SCRIPT_FILES,
  ROOT_TEMPLATES,
  API_URL,
  CONTRACT_ADDRESSES,
  NETWORK,
  IS_TESTNET,
} from "./constants.js";

export function generateUserId(address: string): string {
  return crypto
    .createHash("sha256")
    .update(address.toLowerCase())
    .digest("hex")
    .slice(0, 8);
}

// ─── System checks ──────────────────────────────────────────────────────────

function hasBin(name: string): boolean {
  try {
    execSync(`which ${name}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Prefix command with sudo when not already root */
function sudo(cmd: string): string {
  return process.getuid?.() === 0 ? cmd : `sudo ${cmd}`;
}

/** Detect the system package manager */
function pkgManager(): "apt" | "yum" | "dnf" | null {
  if (hasBin("apt-get")) return "apt";
  if (hasBin("dnf")) return "dnf";
  if (hasBin("yum")) return "yum";
  return null;
}

export function isRootOrSudo(): boolean {
  if (process.getuid?.() === 0) return true;
  return hasBin("sudo");
}

// ─── curl ───────────────────────────────────────────────────────────────────

export function isCurlInstalled(): boolean {
  return hasBin("curl");
}

export function installCurl(): boolean {
  const pm = pkgManager();
  if (!pm) return false;
  try {
    const install =
      pm === "apt"
        ? "apt-get update -y && apt-get install -y curl"
        : `${pm} install -y curl`;
    execSync(sudo(install), { stdio: "pipe", timeout: 120_000 });
    return true;
  } catch {
    return false;
  }
}

// ─── Node.js ────────────────────────────────────────────────────────────────

export function isNodeInstalled(): boolean {
  return hasBin("node");
}

export function installNode(): boolean {
  const pm = pkgManager();
  if (!pm) return false;
  try {
    if (pm === "apt") {
      execSync(
        sudo("bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -'"),
        { stdio: "pipe", timeout: 120_000 },
      );
      execSync(sudo("apt-get install -y nodejs"), {
        stdio: "pipe",
        timeout: 120_000,
      });
    } else {
      // dnf / yum
      execSync(
        sudo(`bash -c 'curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -'`),
        { stdio: "pipe", timeout: 120_000 },
      );
      execSync(sudo(`${pm} install -y nodejs`), {
        stdio: "pipe",
        timeout: 120_000,
      });
    }
    return true;
  } catch {
    return false;
  }
}

// ─── OpenClaw ───────────────────────────────────────────────────────────────

export function isOpenClawInstalled(): boolean {
  return hasBin("openclaw");
}

export function installOpenClaw(): boolean {
  try {
    execSync(sudo("npm install -g openclaw@latest"), {
      stdio: "pipe",
      timeout: 120_000,
    });
    return true;
  } catch {
    return false;
  }
}

export function isValidPrivateKey(key: string): boolean {
  try {
    const hex = key.startsWith("0x") ? key : `0x${key}`;
    if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) return false;
    new ethers.Wallet(hex);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function fetchFileFromGitHub(
  relativePath: string,
  destPath: string,
  replacements?: Record<string, string>,
): Promise<void> {
  const url = `${GITHUB_RAW_BASE}/${relativePath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch ${relativePath}: ${res.status} ${res.statusText}`,
    );
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

export async function readJsonFile(
  filePath: string,
): Promise<Record<string, unknown>> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function findWorkspaces(): Promise<string[]> {
  if (!(await pathExists(OPENCLAW_DIR))) return [];
  try {
    const entries = await fs.readdir(OPENCLAW_DIR);
    return entries.filter((e) => e.startsWith("workspace-foma-"));
  } catch {
    return [];
  }
}

export function generateWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return { address: wallet.address, privateKey: wallet.privateKey };
}

export function importWallet(key: string): { address: string; privateKey: string } {
  const hex = key.startsWith("0x") ? key : `0x${key}`;
  const wallet = new ethers.Wallet(hex);
  return { address: wallet.address, privateKey: wallet.privateKey };
}

export async function writeEnvFile(
  workspacePath: string,
  address: string,
  privateKey: string,
): Promise<void> {
  const envContent = `AGENT_PRIVATE_KEY=${privateKey}
AGENT_ADDRESS=${address}
NETWORK=${IS_TESTNET ? "testnet" : "mainnet"}
RPC_URL=${NETWORK.rpc}
FOMA_API_URL=${API_URL}
FOMA_ADDR=${CONTRACT_ADDRESSES.FOMA}
REGISTRY_ADDR=${CONTRACT_ADDRESSES.REGISTRY}
GOVERNOR_ADDR=${CONTRACT_ADDRESSES.GOVERNOR}
POOL_ADDR=${CONTRACT_ADDRESSES.POOL}
`;
  await fs.writeFile(path.join(workspacePath, ".env"), envContent, {
    mode: 0o600,
  });
}

export async function createWorkspaceDir(workspacePath: string): Promise<void> {
  await ensureDir(workspacePath);
  await ensureDir(path.join(workspacePath, "scripts"));
  await ensureDir(path.join(workspacePath, "references"));
}

export async function fetchTemplates(
  workspacePath: string,
  address: string,
  agentId: string,
): Promise<string[]> {
  const replacements = {
    "{{AGENT_ADDRESS}}": address,
    "{{AGENT_ID}}": agentId,
  };
  const errors: string[] = [];
  for (const file of TEMPLATE_FILES) {
    try {
      const dest = path.join(workspacePath, file);
      await fetchFileFromGitHub(file, dest, replacements);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${file}: ${msg}`);
    }
  }
  return errors;
}

export async function copyRootTemplates(workspacePath: string): Promise<void> {
  for (const [src, dest] of Object.entries(ROOT_TEMPLATES)) {
    const srcPath = path.join(workspacePath, src);
    const destPath = path.join(workspacePath, dest);
    try {
      await ensureDir(path.dirname(destPath));
      await fs.copyFile(srcPath, destPath);
    } catch {
      // Source wasn't fetched, skip
    }
  }
}

export async function fetchScripts(
  workspacePath: string,
): Promise<string[]> {
  const errors: string[] = [];
  for (const file of SCRIPT_FILES) {
    try {
      const dest = path.join(workspacePath, file);
      await fetchFileFromGitHub(file, dest);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${file}: ${msg}`);
    }
  }
  return errors;
}

export async function installScriptDeps(workspacePath: string): Promise<void> {
  const scriptsPkgSrc = path.join(workspacePath, "templates/scripts/package.json");
  const scriptsPkgDest = path.join(workspacePath, "scripts/package.json");
  await fs.copyFile(scriptsPkgSrc, scriptsPkgDest);
  execSync("npm install --production", {
    cwd: path.join(workspacePath, "scripts"),
    stdio: "pipe",
  });
}

export async function updateOpenClawConfig(
  agentId: string,
  workspacePath: string,
): Promise<void> {
  await ensureDir(OPENCLAW_DIR);

  let config: Record<string, unknown> = {};
  if (await pathExists(OPENCLAW_JSON)) {
    try {
      config = await readJsonFile(OPENCLAW_JSON);
    } catch {
      config = {};
    }
  }

  const agents = config.agents as { list: Array<{ id: string }> } | undefined;
  if (!agents) {
    config.agents = { list: [] };
  }
  const agentsList = (config.agents as { list: Array<{ id: string }> }).list;
  if (!agentsList) {
    (config.agents as { list: Array<{ id: string }> }).list = [];
  }

  // Remove existing entry for this agent if re-running
  (config.agents as { list: Array<{ id: string }> }).list = (
    config.agents as { list: Array<{ id: string }> }
  ).list.filter((a) => a.id !== agentId);

  (config.agents as { list: Array<Record<string, unknown>> }).list.push({
    id: agentId,
    name: "FoMA Agent",
    workspace: workspacePath,
    heartbeat: { every: "30m", target: "last" },
  });

  await fs.writeFile(OPENCLAW_JSON, JSON.stringify(config, null, 2), "utf-8");
}

export async function registerWithApi(
  address: string,
  privateKey: string,
): Promise<{ status: "ok" | "exists" | "error"; message: string }> {
  try {
    const viemAccount = privateKeyToAccount(privateKey as `0x${string}`);
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
    } else if (regRes.status === 409) {
      return { status: "exists", message: "Already registered." };
    } else {
      const body = await regRes.text();
      return { status: "error", message: `Registration failed (${regRes.status}): ${body}` };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: "error", message: `Registration deferred: ${msg}` };
  }
}

export function startAgent(agentId: string): void {
  const child = spawn("openclaw", ["start", agentId], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

export function stopAgent(agentId: string): boolean {
  try {
    execSync(`openclaw stop ${agentId}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function getMonBalance(address: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(NETWORK.rpc);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

export async function getWorkspaceEnv(
  workspacePath: string,
): Promise<Record<string, string>> {
  const envPath = path.join(workspacePath, ".env");
  const envContent = await fs.readFile(envPath, "utf-8");
  const vars: Record<string, string> = {};
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return vars;
}
