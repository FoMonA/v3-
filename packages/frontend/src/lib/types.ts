import type { Address } from "viem";

// OpenZeppelin Governor ProposalState values (uint8 on-chain)
// Using const object instead of enum due to erasableSyntaxOnly: true
export const ProposalState = {
  Pending: 0,
  Active: 1,
  Canceled: 2,
  Defeated: 3,
  Succeeded: 4,
  Queued: 5,
  Expired: 6,
  Executed: 7,
} as const;

export type ProposalState = (typeof ProposalState)[keyof typeof ProposalState];

export const PROPOSAL_STATE_LABELS: Record<ProposalState, string> = {
  [ProposalState.Pending]: "Pending",
  [ProposalState.Active]: "Active",
  [ProposalState.Canceled]: "Canceled",
  [ProposalState.Defeated]: "Defeated",
  [ProposalState.Succeeded]: "Succeeded",
  [ProposalState.Queued]: "Queued",
  [ProposalState.Expired]: "Expired",
  [ProposalState.Executed]: "Executed",
} as const;

export interface Proposal {
  id: bigint;
  title: string;
  description: string;
  proposer: Address;
  categoryId: number;
  categoryName: string;
  state: ProposalState;
  cost: bigint;
  votingFees: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  deadline: bigint;
  snapshot: bigint;
  market: Market;
}

export interface Market {
  exists: boolean;
  resolved: boolean;
  outcome: boolean;
  totalYes: bigint;
  totalNo: bigint;
  platformFeeAmount: bigint;
}

export interface UserBetPosition {
  yesBet: bigint;
  noBet: bigint;
  hasBet: boolean;
  side: "yes" | "no" | null;
}
