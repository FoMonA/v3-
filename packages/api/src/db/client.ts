import postgres from "postgres";
import { config } from "../config";
import type { Proposal, Bet, ClaimableBet, Agent } from "../types";

export const sql = postgres(config.databaseUrl, { max: 10 });

// --- Checkpoint ---

export async function getCheckpoint(): Promise<bigint> {
  const rows = await sql`
    SELECT value FROM indexer_state WHERE key = 'last_block'
  `;
  return rows.length > 0 ? BigInt(rows[0].value) : config.network.deployBlock;
}

export async function setCheckpoint(block: bigint): Promise<void> {
  await sql`
    INSERT INTO indexer_state (key, value) VALUES ('last_block', ${block.toString()})
    ON CONFLICT (key) DO UPDATE SET value = ${block.toString()}
  `;
}

// --- Proposals ---

export async function getProposals(opts: {
  category?: number;
  page?: number;
  limit?: number;
}): Promise<Proposal[]> {
  const { category, page = 0, limit = 20 } = opts;
  const offset = page * limit;

  if (category !== undefined) {
    return sql<Proposal[]>`
      SELECT * FROM proposals
      WHERE "categoryId" = ${category}
      ORDER BY "blockNumber" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }
  return sql<Proposal[]>`
    SELECT * FROM proposals
    ORDER BY "blockNumber" DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export async function getProposalById(
  proposalId: string,
): Promise<Proposal | null> {
  const rows = await sql<Proposal[]>`
    SELECT * FROM proposals WHERE "proposalId" = ${proposalId}
  `;
  return rows[0] ?? null;
}

export async function getProposalsByBlockRange(
  field: "voteStart" | "voteEnd",
  op: "lte" | "gt",
  blockNumber: bigint,
): Promise<Proposal[]> {
  if (field === "voteEnd" && op === "gt") {
    return sql<Proposal[]>`
      SELECT * FROM proposals WHERE CAST("voteEnd" AS BIGINT) > ${blockNumber.toString()}
      ORDER BY "blockNumber" DESC
    `;
  }
  if (field === "voteEnd" && op === "lte") {
    return sql<Proposal[]>`
      SELECT * FROM proposals WHERE CAST("voteEnd" AS BIGINT) <= ${blockNumber.toString()}
      ORDER BY "blockNumber" DESC
    `;
  }
  if (field === "voteStart" && op === "lte") {
    return sql<Proposal[]>`
      SELECT * FROM proposals
      WHERE CAST("voteStart" AS BIGINT) <= ${blockNumber.toString()}
        AND CAST("voteEnd" AS BIGINT) > ${blockNumber.toString()}
      ORDER BY "blockNumber" DESC
    `;
  }
  return sql<Proposal[]>`SELECT * FROM proposals ORDER BY "blockNumber" DESC`;
}

// --- Bets ---

export async function getBets(opts: {
  user?: string;
  proposalId?: string;
}): Promise<Bet[]> {
  const { user, proposalId } = opts;
  if (user) {
    return sql<Bet[]>`
      SELECT * FROM bets WHERE LOWER(bettor) = ${user.toLowerCase()}
      ORDER BY "blockNumber" DESC
    `;
  }
  if (proposalId) {
    return sql<Bet[]>`
      SELECT * FROM bets WHERE "proposalId" = ${proposalId}
      ORDER BY "blockNumber" DESC
    `;
  }
  return sql<Bet[]>`SELECT * FROM bets ORDER BY "blockNumber" DESC LIMIT 100`;
}

export async function getClaimableBets(user: string): Promise<ClaimableBet[]> {
  const rows = await sql`
    SELECT b.*, p.title, p.outcome AS "proposalOutcome", p."totalYes", p."totalNo", p."platformFee"
    FROM bets b
    JOIN proposals p ON b."proposalId" = p."proposalId"
    WHERE LOWER(b.bettor) = ${user.toLowerCase()}
      AND p.resolved = true
      AND b.claimed = false
      AND b.side = p.outcome
  `;

  return rows.map((r) => {
    const totalYes = BigInt(r.totalYes ?? "0");
    const totalNo = BigInt(r.totalNo ?? "0");
    const fee = BigInt(r.platformFee ?? "0");
    const userBet = BigInt(r.amount);
    const totalPool = totalYes + totalNo;
    const distributable = totalPool - fee;
    const winningSideTotal = r.proposalOutcome ? totalYes : totalNo;
    const payout =
      winningSideTotal > 0n
        ? (userBet * distributable) / winningSideTotal
        : 0n;

    return {
      proposalId: r.proposalId,
      bettor: r.bettor,
      side: r.side,
      amount: r.amount,
      claimed: r.claimed,
      payout: r.payout,
      blockNumber: r.blockNumber,
      txHash: r.txHash,
      createdAt: r.createdAt,
      title: r.title,
      estimatedPayout: payout.toString(),
      proposalOutcome: r.proposalOutcome,
      totalYes: r.totalYes,
      totalNo: r.totalNo,
      platformFee: r.platformFee,
    } as ClaimableBet;
  });
}

// --- Agents ---

export async function getAgents(): Promise<Agent[]> {
  return sql<Agent[]>`
    SELECT * FROM agents ORDER BY "registeredAt" DESC
  `;
}

// --- Stats ---

export async function getStats(): Promise<{ agentCount: number; proposalCount: number }> {
  const [agents, proposals] = await Promise.all([
    sql`SELECT COUNT(*) AS count FROM agents`,
    sql`SELECT COUNT(*) AS count FROM proposals`,
  ]);
  return {
    agentCount: Number(agents[0].count),
    proposalCount: Number(proposals[0].count),
  };
}

// --- Indexer write helpers ---

export async function insertProposal(p: {
  proposalId: string;
  proposer: string;
  title: string;
  description: string;
  voteStart: string;
  voteEnd: string;
  blockNumber: number;
  txHash: string;
}): Promise<void> {
  await sql`
    INSERT INTO proposals ("proposalId", proposer, title, description, "voteStart", "voteEnd", "blockNumber", "txHash")
    VALUES (${p.proposalId}, ${p.proposer}, ${p.title}, ${p.description}, ${p.voteStart}, ${p.voteEnd}, ${p.blockNumber}, ${p.txHash})
    ON CONFLICT ("proposalId") DO NOTHING
  `;
}

export async function updateProposalCost(p: {
  proposalId: string;
  cost: string;
  categoryId: number;
}): Promise<void> {
  await sql`
    UPDATE proposals SET cost = ${p.cost}, "categoryId" = ${p.categoryId}
    WHERE "proposalId" = ${p.proposalId}
  `;
}

export async function insertBet(b: {
  proposalId: string;
  bettor: string;
  side: boolean;
  amount: string;
  blockNumber: number;
  txHash: string;
}): Promise<void> {
  await sql`
    INSERT INTO bets ("proposalId", bettor, side, amount, "blockNumber", "txHash")
    VALUES (${b.proposalId}, ${b.bettor}, ${b.side}, ${b.amount}, ${b.blockNumber}, ${b.txHash})
    ON CONFLICT ("proposalId", bettor) DO NOTHING
  `;
}

export async function resolveProposal(p: {
  proposalId: string;
  outcome: boolean;
  totalYes: string;
  totalNo: string;
  platformFee: string;
}): Promise<void> {
  await sql`
    UPDATE proposals
    SET resolved = true, outcome = ${p.outcome}, "totalYes" = ${p.totalYes}, "totalNo" = ${p.totalNo}, "platformFee" = ${p.platformFee}
    WHERE "proposalId" = ${p.proposalId}
  `;
}

export async function markBetClaimed(p: {
  proposalId: string;
  bettor: string;
  payout: string;
}): Promise<void> {
  await sql`
    UPDATE bets SET claimed = true, payout = ${p.payout}
    WHERE "proposalId" = ${p.proposalId} AND LOWER(bettor) = ${p.bettor.toLowerCase()}
  `;
}

export async function insertAgent(a: {
  address: string;
  blockNumber: number;
  txHash: string;
}): Promise<void> {
  await sql`
    INSERT INTO agents (address, "blockNumber", "txHash")
    VALUES (${a.address}, ${a.blockNumber}, ${a.txHash})
    ON CONFLICT (address) DO NOTHING
  `;
}
