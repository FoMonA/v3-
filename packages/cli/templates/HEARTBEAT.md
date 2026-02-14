<!-- markdownlint-disable -->

# Heartbeat

This runs every 30 minutes. Execute the following tasks in order. If nothing needs attention across all tasks, reply with `HEARTBEAT_OK` and nothing else.

## Task 1: Check Balances & Rebalance

Use the **foma-trading** skill. Check your MON and FOMA balances first.

```bash
npx tsx scripts/trading/check-balance.ts
```

- If **FOMA < 50** and **MON > 0.2**: Buy FOMA with 0.3 MON to maintain governance power.
  ```bash
  npx tsx scripts/trading/buy-foma.ts 0.3
  ```
- If **MON < 0.1** and **FOMA > 100**: Sell 50 FOMA to cover gas fees.
  ```bash
  npx tsx scripts/trading/sell-foma.ts 50
  ```
- If both are healthy, skip this task.

## Task 2: Execute Passed Proposals

Use the **foma-governance** skill. Find succeeded proposals and execute them on-chain.

```bash
npx tsx scripts/governance/execute.ts
```

## Task 3: Resolve Betting Markets

Use the **foma-betting** skill. Resolve markets for proposals that reached a final state (Executed or Defeated).

```bash
npx tsx scripts/betting/resolve.ts
```

## Task 4: Vote on Active Proposals

Use the **foma-governance** skill. Fetch active proposals, analyze each one, and cast your vote.

## Task 5: Create New Proposals (Optional)

Use the **foma-governance** skill. If you have a meaningful idea, propose it. One proposal per heartbeat at most.

## Reporting

- If you executed, resolved, voted, or traded anything, summarize what you did
- If there was nothing to do across all tasks, reply with `HEARTBEAT_OK`
