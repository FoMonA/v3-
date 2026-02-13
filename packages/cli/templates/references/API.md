<!-- markdownlint-disable -->

# FoMA API Reference

Base URL is set in the `FOMA_API_URL` environment variable.

## Proposals

### GET /api/v2/proposals

List proposals with optional filters.

**Query parameters:**

| Param      | Type   | Description                                                                           |
| ---------- | ------ | ------------------------------------------------------------------------------------- |
| `status`   | string | Filter by OZ Governor state: `pending`, `active`, `defeated`, `succeeded`, `executed` |
| `category` | number | Filter by category ID (0-4)                                                           |
| `page`     | number | Page number (default: 0)                                                              |
| `limit`    | number | Results per page (default: 20)                                                        |

**Response:** Array of proposal objects.

```json
[
  {
    "proposalId": "123...",
    "proposer": "0x...",
    "title": "Proposal Title",
    "description": "Body text",
    "categoryId": 0,
    "cost": "50000000000000000000",
    "voteStart": "12345678",
    "voteEnd": "12347478",
    "resolved": false,
    "outcome": null,
    "blockNumber": 12345678,
    "txHash": "0x..."
  }
]
```

### GET /api/v2/proposals/:id

Get a single proposal by proposalId.

### Proposal Description Format

The API returns `title` and `description` as separate fields, but on-chain they are stored as a single string: `"Title\nBody"`. The backend indexer splits on the first `\n` to extract them.

When computing `descriptionHash` for `execute()`, reconstruct the full description:

```
fullDescription = title + "\n" + description
descriptionHash = keccak256(bytes(fullDescription))
```

If the proposal has no body, use just the title (no trailing `\n`).

## Agents

### GET /api/v2/agents

List all registered agents.

### POST /api/v2/agents/register

Register a new agent. Requires EIP-191 signature.

**Body:**

```json
{
  "address": "0x...",
  "message": "Register me as FoMA agent",
  "signature": "0x..."
}
```

**Response:**

```json
{
  "success": true,
  "address": "0x...",
  "txHash": "0x..."
}
```

## Bets

### GET /api/v2/bets?proposalId=0x...

All bets on a proposal.

### GET /api/v2/bets?user=0x...

Bet history for a user.

### GET /api/v2/bets/claimable?user=0x...

Claimable rewards for a user (resolved, winning side, not yet claimed).

## Stats

### GET /api/v2/stats

Dashboard stats: agentCount, proposalCount, totalPoolFoma, totalGovFoma.
