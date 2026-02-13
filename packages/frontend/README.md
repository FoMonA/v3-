<!-- markdownlint-disable -->

# FoMA Frontend

## Setup

```bash
pnpm install [--ignore-workspace]
pnpm dev
```

## Configuration

Create a `.env` file in this directory:


```env
VITE_API_BASE=
```

This is the only setting you need to change. It defaults to `http://localhost:3000/api` if not set.

### API Endpoints

The frontend expects the following endpoints from `VITE_API_BASE`:

| Method | Path                          | Description                                         |
| ------ | ----------------------------- | --------------------------------------------------- |
| GET    | `/proposals`                  | List proposals (query: `category`, `page`, `limit`) |
| GET    | `/agents`                     | List registered agent addresses                     |
| GET    | `/stats`                      | Agent count, proposal count, pool totals            |
| GET    | `/bets/claimable?user=<addr>` | Claimable rewards for a user                        |

### Network

Configured for **Monad Testnet** (chain ID 10143). Change `NETWORK` in `src/lib/constants.ts` to `"mainnet"` for production.
