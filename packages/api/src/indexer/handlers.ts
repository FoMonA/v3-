import type { Log } from "viem";
import { config } from "../config";
import {
  parseProposalCreated,
  parseProposalCostCharged,
  parseBetPlaced,
  parseMarketResolved,
  parseClaimed,
  parseAgentRegistered,
} from "./parsers";
import {
  insertProposal,
  updateProposalCost,
  insertBet,
  resolveProposal,
  markBetClaimed,
  insertAgent,
} from "../db/client";
import type { BroadcastEvent } from "../types";

const { governor, bettingPool, registry } = config.network.contracts;

export async function handleLog(log: Log): Promise<BroadcastEvent | null> {
  const addr = log.address?.toLowerCase();

  if (addr === governor.toLowerCase()) {
    return handleGovernorLog(log);
  }
  if (addr === bettingPool.toLowerCase()) {
    return handleBettingPoolLog(log);
  }
  if (addr === registry.toLowerCase()) {
    return handleRegistryLog(log);
  }

  return null;
}

async function handleGovernorLog(log: Log): Promise<BroadcastEvent | null> {
  // Try ProposalCreated
  try {
    const parsed = parseProposalCreated(log);
    if (parsed) {
      await insertProposal(parsed);
      return {
        type: "proposal_created",
        data: { proposalId: parsed.proposalId, title: parsed.title },
      };
    }
  } catch {
    /* not this event */
  }

  // Try ProposalCostCharged
  try {
    const parsed = parseProposalCostCharged(log);
    if (parsed) {
      await updateProposalCost(parsed);
      return null; // no separate broadcast, part of proposal_created
    }
  } catch {
    /* not this event */
  }

  return null;
}

async function handleBettingPoolLog(log: Log): Promise<BroadcastEvent | null> {
  // Try BetPlaced
  try {
    const parsed = parseBetPlaced(log);
    if (parsed) {
      await insertBet(parsed);
      return {
        type: "bet_placed",
        data: {
          proposalId: parsed.proposalId,
          bettor: parsed.bettor,
          side: parsed.side,
          amount: parsed.amount,
        },
      };
    }
  } catch {
    /* not this event */
  }

  // Try MarketResolved
  try {
    const parsed = parseMarketResolved(log);
    if (parsed) {
      // Compute totalYes and totalNo from bets table
      const { sql } = await import("../db/client");
      const sums = await sql`
        SELECT
          COALESCE(SUM(CASE WHEN side = true THEN CAST(amount AS NUMERIC) ELSE 0 END), 0) AS "totalYes",
          COALESCE(SUM(CASE WHEN side = false THEN CAST(amount AS NUMERIC) ELSE 0 END), 0) AS "totalNo"
        FROM bets WHERE "proposalId" = ${parsed.proposalId}
      `;
      await resolveProposal({
        proposalId: parsed.proposalId,
        outcome: parsed.outcome,
        totalYes: sums[0].totalYes.toString(),
        totalNo: sums[0].totalNo.toString(),
        platformFee: parsed.platformFee,
      });
      return {
        type: "market_resolved",
        data: {
          proposalId: parsed.proposalId,
          outcome: parsed.outcome,
        },
      };
    }
  } catch {
    /* not this event */
  }

  // Try Claimed
  try {
    const parsed = parseClaimed(log);
    if (parsed) {
      await markBetClaimed({
        proposalId: parsed.proposalId,
        bettor: parsed.bettor,
        payout: parsed.payout,
      });
      return {
        type: "bet_claimed",
        data: {
          proposalId: parsed.proposalId,
          bettor: parsed.bettor,
          payout: parsed.payout,
        },
      };
    }
  } catch {
    /* not this event */
  }

  return null;
}

async function handleRegistryLog(log: Log): Promise<BroadcastEvent | null> {
  try {
    const parsed = parseAgentRegistered(log);
    if (parsed) {
      await insertAgent({
        address: parsed.agent,
        blockNumber: parsed.blockNumber,
        txHash: parsed.txHash,
      });
      return {
        type: "agent_registered",
        data: { address: parsed.agent },
      };
    }
  } catch {
    /* not this event */
  }

  return null;
}
