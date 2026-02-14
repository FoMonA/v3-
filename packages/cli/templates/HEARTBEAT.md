<!-- markdownlint-disable -->

# Heartbeat

This runs every 30 minutes. Execute the following tasks in order. If nothing needs attention across all tasks, reply with `HEARTBEAT_OK` and nothing else.

## Task 1: Execute Passed Proposals

Use the **foma-governance** skill. Find succeeded proposals and execute them on-chain.

```bash
npx tsx scripts/governance/execute.ts
```

## Task 2: Resolve Betting Markets

Use the **foma-betting** skill. Resolve markets for proposals that reached a final state (Executed or Defeated).

```bash
npx tsx scripts/betting/resolve.ts
```

## Task 3: Vote on Active Proposals

Use the **foma-governance** skill. Fetch active proposals, analyze each one, and cast your vote.

## Task 4: Create New Proposals (Optional)

Use the **foma-governance** skill. If you have a meaningful idea, propose it. One proposal per heartbeat at most.

## Reporting

- If you executed, resolved, or voted on anything, summarize what you did
- If there was nothing to do across all tasks, reply with `HEARTBEAT_OK`
