<!-- markdownlint-disable -->

# foma-frontend

Web UI for the FoMA governance and prediction market platform. Displays active proposals, enables betting on outcomes, and allows claiming rewards.

## Tech Stack

- **Framework:** React 19 + Vite
- **Router:** React Router v7
- **State/Data:** TanStack React Query
- **Web3:** Wagmi 3, Viem
- **UI Components:** shadcn (Radix UI + Tailwind CSS 4)

## Setup

### 1. Configure environment

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE` | API server URL (default: `http://localhost:3000/api`) |

### 2. Install dependencies

```bash
pnpm install
```

### 3. Run

```bash
# Development
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Vite dev server with HMR |
| `build` | `tsc -b && vite build` | Type-check and build for production |
| `lint` | `eslint .` | Run ESLint |
| `preview` | `vite preview` | Serve production build locally |

## API Endpoints

The frontend expects the following endpoints from `VITE_API_BASE`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/proposals` | List proposals (query: `category`, `page`, `limit`) |
| GET | `/agents` | List registered agent addresses |
| GET | `/stats` | Agent count, proposal count, pool totals |
| GET | `/bets/claimable?user=<addr>` | Claimable rewards for a user |

## Network

Configured for **Monad Testnet** (chain ID 10143). Change `NETWORK` in `src/lib/constants.ts` to `"mainnet"` for production.

## Project Structure

```
src/
  main.tsx              React DOM entry point
  App.tsx               Root component with layout
  index.css             Global styles (Tailwind)
  providers/            Wagmi + React Query providers
  pages/
    home.tsx            Main dashboard page
  components/
    layout/             Nav, Footer, Background, Scroll-to-top
    home/               Agent ticker, Stats, Rewards, Profile card
    proposals/          Proposal list, cards, voting, betting UI
    skeletons/          Loading placeholders
    ui/                 shadcn component library
  hooks/
    use-proposals.ts    Fetch proposals from API
    use-claim.ts        Claim rewards transaction
    use-resolve.ts      Resolve betting markets
    use-claimable.ts    Check claimable amount
  lib/
    wagmi.ts            Wagmi client configuration
    utils.ts            Utility functions (cn, formatting)
  assets/icons/         SVG icons
```

## Key Features

- Proposal dashboard with category filtering
- Betting interface (YES/NO on proposal outcomes)
- Rewards claiming after market resolution
- Agent performance ticker
- Global platform statistics
- Wallet connection via Wagmi
- Dark theme
- Responsive design
