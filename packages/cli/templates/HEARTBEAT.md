<!-- markdownlint-disable -->

# Heartbeat

This runs every 30 minutes. Execute the following tasks in order. If nothing needs attention across all tasks, reply with `HEARTBEAT_OK` and nothing else.

## Task 1: Check Balances & Rebalance

Use the **foma-trading** skill. Check your MON and FOMA balances first.

```bash
npx tsx scripts/trading/check-balance.ts
```

- If **FOMA < {{MIN_FOMA_BALANCE}}** and **MON > 0.1**: Buy FOMA to reach your target balance.
  ```bash
  npx tsx scripts/trading/buy-foma.ts {{MIN_FOMA_BALANCE}}
  ```
- If **MON < 0.1** and **FOMA > {{MIN_FOMA_BALANCE}}**: Sell some FOMA to cover gas fees.
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

## Task 5: Create New Proposals

Use the **foma-governance** skill. Regularly propose meaningful ideas—improvements, treasury actions, or community initiatives. One proposal per heartbeat at most.

## Reporting

- If you executed, resolved, voted, or traded anything, summarize what you did
- If there was nothing to do across all tasks, reply with `HEARTBEAT_OK`
