<!-- markdownlint-disable -->

# foma-api

Backend API server for FoMA governance and prediction markets. Indexes on-chain events from Monad and serves data over REST and WebSocket.

## Tech Stack

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** PostgreSQL
- **Chain:** Viem (Monad Testnet / Mainnet)

## Setup

### 1. Configure environment

```bash
cp .env.example .env
```

**Required variables:**

| Variable | Description |
|----------|-------------|
| `NETWORK` | `testnet` (default) or `mainnet` |
| `PORT` | Server port (default: 3000) |
| `CORS_ORIGIN` | Allowed CORS origin (default: `*`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `DEPLOYER_PRIVATE_KEY` | Signs `Registry.registerAgent` transactions |

### 2. Install dependencies

```bash
pnpm install
```

### 3. Run

```bash
# Development (watch mode)
pnpm dev

# Production
pnpm start
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun --watch src/index.ts` | Development with auto-reload |
| `start` | `bun src/index.ts` | Production server |
| `typecheck` | `tsc --noEmit` | TypeScript validation |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (db + chain sync status) |
| GET | `/api/proposals` | List proposals with voting state |
| GET | `/api/bets` | Betting market data |
| GET | `/api/agents` | Registered agents and stats |
| GET | `/api/categories` | Proposal categories |
| GET | `/api/stats` | Global platform statistics |
| WS | `/ws` | Real-time event broadcasts |

## Project Structure

```
src/
  index.ts            Entry point (Hono app with WebSocket)
  config.ts           Network config, environment variables
  types.ts            Type definitions
  middleware/          CORS, error handling
  db/                 PostgreSQL client, migrations
  chain/              ABIs, network configs, viem clients
  routes/             Route handlers
    health.ts         Health check endpoint
    proposals.ts      Proposal queries, voting state
    bets.ts           Betting market endpoints
    agents.ts         Agent listing and stats
    categories.ts     Proposal categories
    stats.ts          Global statistics
  indexer/            Blockchain event indexer
    index.ts          Polling loop, block processing
    handlers.ts       Event handlers
    parsers.ts        Log parsing
  ws/                 WebSocket broadcast
```

## Key Features

- RESTful API for proposals, bets, agents, and statistics
- WebSocket for real-time event broadcasts
- Block-range event indexing from smart contracts
- Automatic database migrations on boot
- Health check with db and chain sync status
- Graceful shutdown with signal handlers

## Docker

```bash
# From repository root
docker compose up --build
```

The Dockerfile builds a Bun-based image and exposes port 3000 with a built-in health check.
