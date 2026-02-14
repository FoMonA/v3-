import { Hono } from "hono";
import {
  getProposals,
  getProposalById,
  getProposalsByBlockRange,
} from "../db/client";
import { publicClient } from "../chain/clients";
import { governorAbi } from "../chain/abis";
import { config } from "../config";

const proposals = new Hono();

// OZ Governor state enum
const STATE_MAP: Record<string, number> = {
  pending: 0,
  active: 1,
  canceled: 2,
  defeated: 3,
  succeeded: 4,
  queued: 5,
  expired: 6,
  executed: 7,
};

proposals.get("/api/proposals/active", async (c) => {
  try {
    const clock = await publicClient.readContract({
      address: config.network.contracts.governor,
      abi: governorAbi,
      functionName: "clock",
    });
    const currentBlock = BigInt(clock);

    const active = await getProposalsByBlockRange(
      "voteStart",
      "lte",
      currentBlock,
    );
    return c.json(active);
  } catch (err) {
    console.error("[proposals/active] error:", err);
    return c.json({ error: "Failed to fetch active proposals" }, 500);
  }
});

proposals.get("/api/proposals/:id", async (c) => {
  const id = c.req.param("id");
  const proposal = await getProposalById(id);
  if (!proposal) return c.json({ error: "Proposal not found" }, 404);

  // Enrich with on-chain state + vote counts
  try {
    const proposalIdBigInt = BigInt(proposal.proposalId);
    const [state, votes] = await Promise.all([
      publicClient.readContract({
        address: config.network.contracts.governor,
        abi: governorAbi,
        functionName: "state",
        args: [proposalIdBigInt],
      }),
      publicClient.readContract({
        address: config.network.contracts.governor,
        abi: governorAbi,
        functionName: "proposalVotes",
        args: [proposalIdBigInt],
      }),
    ]);

    proposal.state = Number(state);
    const [againstVotes, forVotes] = votes as [bigint, bigint, bigint];
    proposal.forVotes = forVotes.toString();
    proposal.againstVotes = againstVotes.toString();
  } catch {
    // On-chain enrichment failed, return DB data only
  }

  return c.json(proposal);
});

proposals.get("/api/proposals", async (c) => {
  const category = c.req.query("category");
  const status = c.req.query("status");
  const page = parseInt(c.req.query("page") ?? "0", 10);
  const limit = parseInt(c.req.query("limit") ?? "20", 10);

  // No status filter — pure DB query + multicall enrichment
  if (!status) {
    const rows = await getProposals({
      category: category !== undefined ? parseInt(category, 10) : undefined,
      page,
      limit,
    });

    // Enrich with on-chain state
    if (rows.length > 0) {
      try {
        const results = await publicClient.multicall({
          contracts: rows.map((p) => ({
            address: config.network.contracts.governor,
            abi: governorAbi,
            functionName: "state" as const,
            args: [BigInt(p.proposalId)],
          })),
        });
        for (let i = 0; i < rows.length; i++) {
          if (results[i].status === "success") {
            rows[i].state = Number(results[i].result);
          }
        }
      } catch {
        // multicall failed, return without state
      }
    }

    return c.json(rows);
  }

  // Status filter — hybrid: DB pre-filter + multicall
  const targetState = STATE_MAP[status.toLowerCase()];
  if (targetState === undefined) {
    return c.json({ error: `Invalid status: ${status}` }, 400);
  }

  try {
    const clock = await publicClient.readContract({
      address: config.network.contracts.governor,
      abi: governorAbi,
      functionName: "clock",
    });
    const currentBlock = BigInt(clock);

    // DB pre-filter: narrow candidates
    let candidates;
    if (targetState === 1) {
      // active: voteStart <= now < voteEnd
      candidates = await getProposalsByBlockRange(
        "voteStart",
        "lte",
        currentBlock,
      );
    } else if (targetState >= 3) {
      // defeated/succeeded/executed: voteEnd <= now
      candidates = await getProposalsByBlockRange(
        "voteEnd",
        "lte",
        currentBlock,
      );
    } else {
      // pending/other: check all
      candidates = await getProposals({
        category: category !== undefined ? parseInt(category, 10) : undefined,
      });
    }

    if (candidates.length === 0) return c.json([]);

    // Multicall state() on candidates
    const results = await publicClient.multicall({
      contracts: candidates.map((p) => ({
        address: config.network.contracts.governor,
        abi: governorAbi,
        functionName: "state" as const,
        args: [BigInt(p.proposalId)],
      })),
    });

    const filtered = candidates.filter((_, i) => {
      if (results[i].status !== "success") return false;
      return Number(results[i].result) === targetState;
    });

    // Apply category filter
    let result = filtered;
    if (category !== undefined) {
      const catId = parseInt(category, 10);
      result = result.filter((p) => p.categoryId === catId);
    }

    // Apply pagination
    const start = page * limit;
    const paged = result.slice(start, start + limit);

    // Attach state
    paged.forEach((p) => (p.state = targetState));

    return c.json(paged);
  } catch (err) {
    console.error("[proposals] status filter error:", err);
    return c.json({ error: "Failed to filter proposals by status" }, 500);
  }
});

export default proposals;
