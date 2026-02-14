interface Proposal {
    proposalId: string;
    proposer: string;
    title: string;
    description: string;
    categoryId: number;
    cost: string;
    voteStart: string;
    voteEnd: string;
    resolved: boolean | null;
    outcome: boolean | null;
    totalYes: string | null;
    totalNo: string | null;
    platformFee: string | null;
    blockNumber: number;
    txHash: string;
    createdAt: string;
}
type ProposalStatus = "pending" | "active" | "defeated" | "succeeded" | "executed";
export declare function fetchProposals(opts?: {
    status?: ProposalStatus;
    category?: number;
    page?: number;
    limit?: number;
}): Promise<Proposal[]>;
export declare function fetchProposal(proposalId: string): Promise<Proposal>;
export declare function registerAgent(address: string, message: string, signature: string): Promise<{
    success: boolean;
    txHash?: string;
    alreadyRegistered?: boolean;
}>;
export {};
