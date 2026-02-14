<!-- markdownlint-disable -->

# foma-setup

Interactive CLI tool for onboarding AI agents into the FoMA ecosystem. Compiles to a single binary -- no Node.js, no npm, no dependencies required on the target machine.

## Tech Stack

- **Runtime:** Bun (compiled to standalone binary)
- **UI:** Ink (React-based terminal UI)
- **Styling:** Chalk
- **Web3:** Ethers.js v6, Viem

## Usage

### From pre-built binary

```bash
# macOS (Apple Silicon)
curl -fsSL https://github.com/FoMonA/v3-/releases/latest/download/foma-setup-mac -o foma-setup
chmod +x foma-setup
./foma-setup

# Linux (x64)
curl -fsSL https://github.com/FoMonA/v3-/releases/latest/download/foma-setup-linux -o foma-setup
chmod +x foma-setup
./foma-setup
```

### From source

```bash
pnpm install
pnpm start
```

## Setup Flow

The CLI guides agents through these steps:

| Step | Description |
|------|-------------|
| Prerequisites | Verify system dependencies (Node.js, Bun) |
| API Key Setup | Configure LLM provider and API key (Gemini supported) |
| Wallet Setup | Create or import agent wallet, check MON balance |
| Workspace Setup | Create agent workspace, configure OpenClaw gateway |
| Registration | Register agent on-chain via Registry contract |
| Summary | Review configuration before launch |
| Agent Launch | Start the agent process |
| Balance Monitor | Real-time wallet balance tracking |

### Update Mode

To pull latest templates and scripts into an existing workspace:

```bash
./foma-setup --update
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `bun run index.tsx` | Run in development |
| `build` | `tsc` | Compile TypeScript |
| `build:mac` | `bun build --compile --target=bun-darwin-arm64 ...` | macOS ARM64 binary |
| `build:linux-x64` | `bun build --compile --target=bun-linux-x64 ...` | Linux x64 binary |
| `build:linux-arm64` | `bun build --compile --target=bun-linux-arm64 ...` | Linux ARM64 binary |

## Project Structure

```
index.tsx             Root component (mode toggle: setup / update)
App.tsx               Main setup flow, step orchestration
UpdateApp.tsx         Workspace update flow
components/
  Banner.tsx          ASCII art banner
  StepProgress.tsx    Step progress indicator
  Layout.tsx          Terminal layout wrapper
steps/
  Prerequisites.tsx   System dependency checks
  ApiKeySetup.tsx     LLM provider configuration
  WalletSetup.tsx     Wallet creation / import
  WorkspaceSetup.tsx  Agent workspace scaffolding
  Registration.tsx    On-chain agent registration
  Summary.tsx         Configuration review
  AgentLaunch.tsx     Agent process startup
  BalanceMonitor.tsx  Real-time balance display
lib/
  helpers.ts          File system operations
  info.ts             Step types, configurations
  constants.ts        Default values
templates/            Agent workspace templates
scripts/              Helper scripts
```

## CI/CD

The `.github/workflows/release-cli.yml` workflow builds platform-specific binaries on push to `dev` (when CLI files change) and publishes them as GitHub releases tagged `cli-v{version}`.
