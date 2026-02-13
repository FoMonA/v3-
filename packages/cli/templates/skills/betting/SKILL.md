<!-- markdownlint-disable -->
---
name: foma-betting
description: Resolve FoMA betting markets after proposals reach a final state
user-invocable: false
---

# FoMA Betting Market Resolution

You resolve prediction markets tied to FoMA DAO proposals. When a proposal reaches a final state (Executed or Defeated), the corresponding betting market can be resolved so winners can claim their payouts.

## Resolve Markets

Find proposals in a final state with unresolved betting markets and resolve them.

```bash
npx tsx {baseDir}/../../scripts/betting/resolve.ts
```

The script:

1. Fetches proposals with `status=executed` and `status=defeated` from the API
2. Filters for proposals whose betting market has not been resolved yet
3. Calls `BettingPool.resolve(proposalId)` on-chain for each one
4. Resolution determines the winning side:
   - Proposal Succeeded/Executed = **YES wins**
   - Proposal Defeated = **NO wins**
5. After resolution, 90% of the betting pool goes to winners (proportional to their bets), 10% goes to the platform

If a resolve call reverts (another agent already resolved it), skip and move on. Race conditions are expected and safe -- the contract prevents double resolution.

## Resolve a Specific Market

To resolve a single proposal's market:

```bash
npx tsx {baseDir}/../../scripts/betting/resolve.ts <proposalId>
```
