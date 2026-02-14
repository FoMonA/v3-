import { decodeEventLog, type Log } from "viem";
import { governorAbi, bettingPoolAbi, registryAbi } from "../chain/abis";

export function parseProposalCreated(log: Log) {
  const decoded = decodeEventLog({
    abi: governorAbi,
    data: log.data,
    topics: log.topics,
    strict: false,
  });
  if (decoded.eventName !== "ProposalCreated") return null;
  const args = decoded.args as {
    proposalId: bigint;
    proposer: string;
    voteStart: bigint;
    voteEnd: bigint;
    description: string;
  };

  const lines = args.description.split("\n");
  const rawTitle = lines[0]?.trim() ?? "";
  const title = rawTitle.replace(/^#+\s*/, "") || "Untitled Proposal";
  const body = lines.length > 1 ? lines.slice(1).join("\n").trim() : "";

  return {
    proposalId: args.proposalId.toString(),
    proposer: args.proposer,
    title,
    description: body,
    voteStart: args.voteStart.toString(),
    voteEnd: args.voteEnd.toString(),
    blockNumber: Number(log.blockNumber),
    txHash: log.transactionHash!,
  };
}

export function parseProposalCostCharged(log: Log) {
  const decoded = decodeEventLog({
    abi: governorAbi,
    data: log.data,
    topics: log.topics,
    strict: false,
  });
  if (decoded.eventName !== "ProposalCostCharged") return null;
  const args = decoded.args as {
    proposalId: bigint;
    cost: bigint;
    categoryId: bigint;
  };
  return {
    proposalId: args.proposalId.toString(),
    cost: args.cost.toString(),
    categoryId: Number(args.categoryId),
  };
}

export function parseBetPlaced(log: Log) {
  const decoded = decodeEventLog({
    abi: bettingPoolAbi,
    data: log.data,
    topics: log.topics,
    strict: false,
  });
  if (decoded.eventName !== "BetPlaced") return null;
  const args = decoded.args as {
    proposalId: bigint;
    bettor: string;
    yesOrNo: boolean;
    amount: bigint;
  };
  return {
    proposalId: args.proposalId.toString(),
    bettor: args.bettor,
    side: args.yesOrNo,
    amount: args.amount.toString(),
    blockNumber: Number(log.blockNumber),
    txHash: log.transactionHash!,
  };
}

export function parseMarketResolved(log: Log) {
  const decoded = decodeEventLog({
    abi: bettingPoolAbi,
    data: log.data,
    topics: log.topics,
    strict: false,
  });
  if (decoded.eventName !== "MarketResolved") return null;
  const args = decoded.args as {
    proposalId: bigint;
    outcome: boolean;
    totalPool: bigint;
    platformFee: bigint;
  };
  return {
    proposalId: args.proposalId.toString(),
    outcome: args.outcome,
    totalPool: args.totalPool.toString(),
    platformFee: args.platformFee.toString(),
  };
}

export function parseClaimed(log: Log) {
  const decoded = decodeEventLog({
    abi: bettingPoolAbi,
    data: log.data,
    topics: log.topics,
    strict: false,
  });
  if (decoded.eventName !== "Claimed") return null;
  const args = decoded.args as {
    proposalId: bigint;
    bettor: string;
    payout: bigint;
  };
  return {
    proposalId: args.proposalId.toString(),
    bettor: args.bettor,
    payout: args.payout.toString(),
  };
}

export function parseAgentRegistered(log: Log) {
  const decoded = decodeEventLog({
    abi: registryAbi,
    data: log.data,
    topics: log.topics,
    strict: false,
  });
  if (decoded.eventName !== "AgentRegistered") return null;
  const args = decoded.args as { agent: string };
  return {
    agent: args.agent,
    blockNumber: Number(log.blockNumber),
    txHash: log.transactionHash!,
  };
}
