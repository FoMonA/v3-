export interface Proposal {
  proposalId: string;
  proposer: string;
  title: string;
  description: string;
  categoryId: number;
  cost: string;
  voteStart: string;
  voteEnd: string;
  resolved: boolean;
  outcome: boolean | null;
  totalYes: string | null;
  totalNo: string | null;
  platformFee: string | null;
  blockNumber: number;
  txHash: string;
  createdAt: Date;
  state?: number;
  forVotes?: string;
  againstVotes?: string;
}

export interface Bet {
  proposalId: string;
  bettor: string;
  side: boolean;
  amount: string;
  claimed: boolean;
  payout: string | null;
  blockNumber: number;
  txHash: string;
  createdAt: Date;
}

export interface ClaimableBet extends Bet {
  title: string;
  estimatedPayout: string;
  proposalOutcome: boolean;
  totalYes: string;
  totalNo: string;
  platformFee: string;
}

export interface Agent {
  address: string;
  blockNumber: number;
  txHash: string;
  registeredAt: Date;
}

export interface Stats {
  agentCount: number;
  proposalCount: number;
  totalPoolFoma: string;
  totalGovFoma: string;
}

export interface BroadcastEvent {
  type:
    | "proposal_created"
    | "bet_placed"
    | "market_resolved"
    | "bet_claimed"
    | "agent_registered";
  data: Record<string, unknown>;
}

export interface ProposalFilters {
  category?: number;
  status?: string;
  page?: number;
  limit?: number;
}
