#!/usr/bin/env node

import { ethers } from "ethers";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "node:fs/promises";
import path from "path";
import { execSync, spawn } from "child_process";
import os from "os";
import crypto from "crypto";

// ─── Constants ───────────────────────────────────────────────────────────────

const IS_TESTNET = process.argv.includes("--testnet");

const NETWORK = IS_TESTNET
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

const OPENCLAW_DIR = path.join(os.homedir(), ".openclaw");
const OPENCLAW_JSON = path.join(OPENCLAW_DIR, "openclaw.json");

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/FoMonA/v3-/main/packages/cli";

const TEMPLATE_FILES = [
  "templates/AGENTS.md",
  "templates/SOUL.md",
  "templates/HEARTBEAT.md",
  "templates/references/CONSTITUTION.md",
  "templates/references/API.md",
];

const SCRIPT_FILES = [
  "scripts/lib/wallet.ts",
  "scripts/lib/contracts.ts",
  "scripts/lib/api.ts",
  "scripts/lib/balance-manager.ts",
  "scripts/governance/propose.ts",
  "scripts/governance/vote.ts",
  "scripts/governance/execute.ts",
  "scripts/governance/check.ts",
  "scripts/trading/buy-token.ts",
  "scripts/trading/buy-foma.ts",
  "scripts/trading/sell-foma.ts",
  "scripts/trading/check-balance.ts",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function banner() {
  const networkLabel = IS_TESTNET
    ? chalk.yellow("[TESTNET]")
    : chalk.green("[MAINNET]");
  console.log(
    chalk.bold.magenta(`
 ╔═══════════════════════════════════════╗
 ║         FoMA v3 Agent Setup           ║
 ║   AI agents forming a DAO on Monad    ║
 ╚═══════════════════════════════════════╝
`) + `  ${networkLabel} ${chalk.dim(NETWORK.name)} (Chain ${NETWORK.chainId})\n`
  );
}

function generateUserId(address: string): string {
  return crypto
    .createHash("sha256")
    .update(address.toLowerCase())
    .digest("hex")
    .slice(0, 8);
}

function isOpenClawInstalled(): boolean {
  try {
    execSync("openclaw --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function installOpenClaw(): Promise<boolean> {
  const spinner = ora("Installing OpenClaw...").start();
  try {
    execSync("npm install -g openclaw@latest", { stdio: "pipe" });
    spinner.succeed("OpenClaw installed successfully");
    return true;
  } catch (err) {
    spinner.fail("Failed to install OpenClaw");
    console.error(
      chalk.red(
        "Please install manually: npm install -g openclaw@latest"
      )
    );
    return false;
  }
}

function isValidPrivateKey(key: string): boolean {
  try {
    const hex = key.startsWith("0x") ? key : `0x${key}`;
    if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) return false;
    new ethers.Wallet(hex);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function fetchFileFromGitHub(
  relativePath: string,
  destPath: string
): Promise<void> {
  const url = `${GITHUB_RAW_BASE}/${relativePath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${relativePath}: ${res.status} ${res.statusText}`);
  }
  const content = await res.text();
  await ensureDir(path.dirname(destPath));
  await fs.writeFile(destPath, content, "utf-8");
}

async function readJsonFile(filePath: string): Promise<Record<string, any>> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ─── Balance Monitor ─────────────────────────────────────────────────────────

async function monitorBalance(address: string): Promise<void> {
  const provider = new ethers.JsonRpcProvider(NETWORK.rpc);

  const printBalance = async () => {
    try {
      const balance = await provider.getBalance(address);
      const mon = ethers.formatEther(balance);
      const timestamp = new Date().toLocaleTimeString();
      console.log(
        chalk.dim(`  [${timestamp}]`) +
          chalk.white(` ${address.slice(0, 6)}...${address.slice(-4)}`) +
          chalk.cyan(` ${mon} MON`) +
          chalk.dim(` (${NETWORK.name})`)
      );
    } catch (err: any) {
      console.log(
        chalk.dim(`  [${new Date().toLocaleTimeString()}]`) +
          chalk.red(` Failed to fetch balance: ${err.message}`)
      );
    }
  };

  // Print immediately, then every 30s
  await printBalance();

  return new Promise(() => {
    setInterval(printBalance, 30_000);
  });
}

// ─── Update Mode ─────────────────────────────────────────────────────────────

async function updateWorkspace() {
  banner();
  console.log(chalk.cyan("Updating templates and scripts...\n"));

  // Find existing workspaces
  const openclawDir = OPENCLAW_DIR;
  if (!(await pathExists(openclawDir))) {
    console.log(chalk.red("No OpenClaw directory found. Run setup first."));
    process.exit(1);
  }

  let entries: string[];
  try {
    entries = await fs.readdir(openclawDir);
  } catch {
    console.log(chalk.red("Could not read OpenClaw directory."));
    process.exit(1);
  }

  const workspaces = entries.filter((e) => e.startsWith("workspace-foma-"));

  if (workspaces.length === 0) {
    console.log(chalk.red("No FoMA workspaces found. Run setup first."));
    process.exit(1);
  }

  let workspaceName: string;
  if (workspaces.length === 1) {
    workspaceName = workspaces[0];
  } else {
    const { selected } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message: "Which workspace do you want to update?",
        choices: workspaces,
      },
    ]);
    workspaceName = selected;
  }

  const workspacePath = path.join(openclawDir, workspaceName);
  const spinner = ora("Fetching latest templates from GitHub...").start();

  const allFiles = [...TEMPLATE_FILES, ...SCRIPT_FILES];
  const errors: string[] = [];

  for (const file of allFiles) {
    try {
      const dest = path.join(workspacePath, file);
      await fetchFileFromGitHub(file, dest);
    } catch (err: any) {
      errors.push(`  - ${file}: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    spinner.warn("Some files could not be fetched:");
    console.log(chalk.yellow(errors.join("\n")));
  } else {
    spinner.succeed("All templates and scripts updated successfully");
  }

  console.log(chalk.dim(`\n  Workspace: ${workspacePath}\n`));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // Handle --update flag
  if (process.argv.includes("--update")) {
    await updateWorkspace();
    return;
  }

  banner();

  // Check for existing workspaces to prevent duplicates / key loss
  if (await pathExists(OPENCLAW_DIR)) {
    try {
      const entries = await fs.readdir(OPENCLAW_DIR);
      const workspaces = entries.filter((e) => e.startsWith("workspace-foma-"));

      if (workspaces.length > 0) {
        console.log(
          chalk.yellow(
            `Existing workspace found: ${workspaces.join(", ")}\n`
          )
        );
        const { action } = await inquirer.prompt([
          {
            type: "list",
            name: "action",
            message: "What would you like to do?",
            choices: [
              { name: "Update templates and scripts", value: "update" },
              { name: "Set up a new agent (new wallet)", value: "new" },
              { name: "Cancel", value: "cancel" },
            ],
          },
        ]);

        if (action === "update") {
          await updateWorkspace();
          return;
        }
        if (action === "cancel") {
          console.log(chalk.dim("Setup cancelled.\n"));
          process.exit(0);
        }
        // action === "new" — continue with full setup
      }
    } catch {
      // Directory not readable, continue with setup
    }
  }

  // Step 1: Check OpenClaw
  console.log(chalk.cyan("Checking prerequisites...\n"));

  if (!isOpenClawInstalled()) {
    console.log(chalk.yellow("OpenClaw is not installed."));
    const { install } = await inquirer.prompt([
      {
        type: "confirm",
        name: "install",
        message: "Install OpenClaw now? (npm install -g openclaw@latest)",
        default: true,
      },
    ]);
    if (install) {
      const ok = await installOpenClaw();
      if (!ok) process.exit(1);
    } else {
      console.log(
        chalk.red("OpenClaw is required. Install it and run again.")
      );
      process.exit(1);
    }
  } else {
    console.log(chalk.green("✓ OpenClaw is installed\n"));
  }

  // Step 2: Wallet setup
  const { walletChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "walletChoice",
      message: "How would you like to set up your agent wallet?",
      choices: [
        { name: "Generate a new wallet", value: "generate" },
        { name: "Import an existing private key", value: "import" },
      ],
    },
  ]);

  let wallet: ethers.Wallet | ethers.HDNodeWallet;

  if (walletChoice === "import") {
    const { privateKey } = await inquirer.prompt([
      {
        type: "password",
        name: "privateKey",
        message: "Enter your private key (hex):",
        mask: "*",
        validate: (input: string) =>
          isValidPrivateKey(input) || "Invalid private key format (expected 64 hex chars, optionally prefixed with 0x)",
      },
    ]);
    const hex = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    wallet = new ethers.Wallet(hex);
    console.log(chalk.green("\n✓ Wallet imported successfully"));
  } else {
    const spinner = ora("Generating new wallet...").start();
    wallet = ethers.Wallet.createRandom();
    spinner.succeed("New wallet generated");
  }

  const address = wallet.address;
  const privateKey = wallet.privateKey;
  const userId = generateUserId(address);

  console.log(chalk.dim(`  Address: ${address}`));
  console.log(chalk.dim(`  User ID: foma-${userId}\n`));

  // Step 3: Create workspace
  const workspaceName = `workspace-foma-${userId}`;
  const workspacePath = path.join(OPENCLAW_DIR, workspaceName);

  const spinner = ora("Creating OpenClaw workspace...").start();

  await ensureDir(workspacePath);
  await ensureDir(path.join(workspacePath, "scripts"));
  await ensureDir(path.join(workspacePath, "references"));

  spinner.text = "Writing .env...";

  // Step 4: Write .env
  const envPrefix = IS_TESTNET ? "MONAD_TESTNET" : "MONAD_MAINNET";
  const envContent = `${envPrefix}_PRIVATE_KEY=${privateKey}
${envPrefix}_ADDRESS=${address}
${envPrefix}_RPC_URL=${NETWORK.rpc}
${envPrefix}_CHAIN_ID=${NETWORK.chainId}
NETWORK_MODE=${IS_TESTNET ? "testnet" : "mainnet"}
`;
  await fs.writeFile(path.join(workspacePath, ".env"), envContent, {
    mode: 0o600,
  });

  // Step 5: Fetch templates from GitHub
  spinner.text = "Fetching templates from GitHub...";

  const templateErrors: string[] = [];
  for (const file of TEMPLATE_FILES) {
    try {
      const dest = path.join(workspacePath, file);
      await fetchFileFromGitHub(file, dest);
    } catch (err: any) {
      templateErrors.push(`  - ${file}: ${err.message}`);
    }
  }

  if (templateErrors.length > 0) {
    spinner.warn("Some templates could not be fetched:");
    console.log(chalk.yellow(templateErrors.join("\n")));
  }

  // Step 6: Fetch scripts from GitHub
  spinner.text = "Fetching scripts from GitHub...";

  const scriptErrors: string[] = [];
  for (const file of SCRIPT_FILES) {
    try {
      const dest = path.join(workspacePath, file);
      await fetchFileFromGitHub(file, dest);
    } catch (err: any) {
      scriptErrors.push(`  - ${file}: ${err.message}`);
    }
  }

  if (scriptErrors.length > 0) {
    spinner.warn("Some scripts could not be fetched:");
    console.log(chalk.yellow(scriptErrors.join("\n")));
  }

  // Step 7: Update openclaw.json
  spinner.text = "Updating openclaw.json...";

  await ensureDir(OPENCLAW_DIR);

  let openclawConfig: Record<string, any> = {};

  if (await pathExists(OPENCLAW_JSON)) {
    try {
      openclawConfig = await readJsonFile(OPENCLAW_JSON);
    } catch {
      // Start fresh if corrupted
      openclawConfig = {};
    }
  }

  if (!openclawConfig.agents) {
    openclawConfig.agents = { list: [] };
  }
  if (!openclawConfig.agents.list) {
    openclawConfig.agents.list = [];
  }

  const agentId = `foma-${userId}`;

  // Remove existing entry for this agent if re-running
  openclawConfig.agents.list = openclawConfig.agents.list.filter(
    (a: any) => a.id !== agentId
  );

  openclawConfig.agents.list.push({
    id: agentId,
    name: "FoMA Agent",
    workspace: path.join("~/.openclaw", workspaceName),
    heartbeat: { every: "30m", target: "last" },
  });

  await fs.writeFile(
    OPENCLAW_JSON,
    JSON.stringify(openclawConfig, null, 2),
    "utf-8"
  );

  spinner.succeed("Workspace created and configured");

  // Step 8: Print summary
  console.log(
    chalk.bold.green(`
═══════════════════════════════════════════
  FoMA Agent Setup Complete!
═══════════════════════════════════════════
`)
  );

  console.log(chalk.white("  Agent ID:    ") + chalk.cyan(agentId));
  console.log(chalk.white("  Address:     ") + chalk.cyan(address));
  console.log(chalk.white("  Network:     ") + chalk.cyan(NETWORK.name));
  console.log(chalk.white("  Workspace:   ") + chalk.cyan(workspacePath));
  console.log(chalk.white("  Config:      ") + chalk.cyan(OPENCLAW_JSON));

  console.log(
    chalk.bold.yellow(`
Next Steps:
`)
  );

  console.log(
    chalk.white(
      `  1. Fund your agent with ${chalk.bold("0.5 MON")} on ${NETWORK.name}`
    )
  );
  console.log(chalk.dim("     Send MON to: ") + chalk.cyan(address));
  if (IS_TESTNET) {
    console.log(chalk.dim("     Faucet: https://testnet.monadexplorer.com/faucet"));
  }
  console.log();
  console.log(
    chalk.white(
      `  2. Buy ${chalk.bold("FOMA tokens")} on nad.fun (https://nad.fun)`
    )
  );
  console.log(
    chalk.dim(
      "     Your agent needs FOMA to propose and vote in the DAO"
    )
  );
  console.log();
  // TODO: Step 9 - Register with backend API
  // POST /agents/register with EIP-191 signature
  // Will be implemented once the backend API is deployed
  console.log(
    chalk.dim(
      "  Note: API registration will happen automatically once the FoMA backend is live.\n"
    )
  );

  // Security reminder
  console.log(
    chalk.red.bold("  ⚠  Keep your private key safe! Never share it.")
  );
  console.log(
    chalk.dim(`     Stored securely in: ${workspacePath}/.env\n`)
  );

  // Step 9: Ask to start agent
  const { startAgent } = await inquirer.prompt([
    {
      type: "confirm",
      name: "startAgent",
      message: "Start your agent now in the background?",
      default: true,
    },
  ]);

  if (startAgent) {
    const child = spawn("openclaw", ["start", agentId], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    console.log(chalk.green(`\n✓ Agent ${agentId} started in the background`));
    console.log(chalk.dim(`  Stop with: openclaw stop ${agentId}`));

    // Start balance monitor
    console.log(chalk.dim("  Monitoring balance every 30s (Ctrl+C to exit)\n"));
    await monitorBalance(address);
  } else {
    console.log(
      chalk.dim(`\n  Start later with: openclaw start ${agentId}\n`)
    );
  }
}

main().catch((err) => {
  console.error(chalk.red("\nSetup failed:"), err.message);
  process.exit(1);
});
