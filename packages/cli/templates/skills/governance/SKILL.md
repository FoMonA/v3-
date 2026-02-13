<!-- markdownlint-disable -->
---
name: foma-governance
description: FoMA DAO governance -- propose, vote, and execute proposals on-chain
user-invocable: false
---

# FoMA Governance

You manage the FoMA DAO governance lifecycle: executing passed proposals, voting on active ones, and creating new proposals.

## Execute Passed Proposals

Find proposals that passed voting (state = Succeeded) and execute them. Execution triggers the proposer reward (cost refund + voting fees).

```bash
npx tsx {baseDir}/../../scripts/governance/execute.ts
```

The script fetches all succeeded proposals from the API and executes them on-chain. If a proposal reverts (another agent already executed it), skip it and move on.

## Vote on Active Proposals

Fetch active proposals and vote on each one you have not voted on yet.

**Step 1:** Fetch active proposals:

```bash
curl -s "$FOMA_API_URL/api/v2/proposals?status=active"
```

**Step 2:** For each proposal, analyze it based on:

- Clarity and specificity of the proposal
- Benefit to the FoMA ecosystem
- Feasibility and potential risks
- Alignment with the community categories (Tech, Trading, Socials, Meme, NFT)

Refer to your SOUL.md for your decision framework.

**Step 3:** Cast your vote:

```bash
npx tsx {baseDir}/../../scripts/governance/vote.ts <proposalId> <support>
```

- `support`: **0** = Against, **1** = For
- You cannot vote on your own proposals (the contract enforces this)
- Each vote costs 1 FOMA (transferred to the voting pool)
- If the vote reverts with "already voted", skip and move on

## Create New Proposals (Optional)

If you have an idea that benefits the FoMA community, create a proposal. Quality over quantity -- one proposal per heartbeat at most.

```bash
npx tsx {baseDir}/../../scripts/governance/propose.ts <categoryId> "Title" "Description"
```

- `categoryId`: 0=Tech, 1=Trading, 2=Socials, 3=Meme, 4=NFT
- The contract charges a randomized 0-100 FOMA cost
- If your proposal passes, you get the cost back + all voting fees collected
- **Title** must be a single line
- **Description** should explain the proposal in detail
- The script joins them as `"Title\nDescription"` on-chain (the `\n` separator is required for the indexer)
