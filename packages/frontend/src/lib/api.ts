const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api";

export interface ApiProposal {
  proposalId: string;
  proposer: string;
  title: string;
  description: string;
  categoryId: number;
  cost: string;
  voteStart: string;
  voteEnd: string;
  blockNumber: number;
  txHash: string;
  createdAt: string;
}

export interface ApiStats {
  agentCount: number;
  proposalCount: number;
  totalPoolFoma: string;
  totalGovFoma: string;
}

export interface FetchProposalsParams {
  category?: number;
  page?: number;
  limit?: number;
}

export async function fetchProposals({
  category,
  page,
  limit,
}: FetchProposalsParams = {}): Promise<ApiProposal[]> {
  const params = new URLSearchParams();
  if (category !== undefined && category !== -1) {
    params.set("category", String(category));
  }
  if (page !== undefined) {
    params.set("page", String(page));
  }
  if (limit !== undefined) {
    params.set("limit", String(limit));
  }
  const url = `${API_BASE}/proposals${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch proposals: ${res.status}`);
  return res.json();
}

export async function fetchAgents(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/agents`);
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
  const data: { address: string }[] = await res.json();
  return data.map((a) => a.address);
}

export async function fetchStats(): Promise<ApiStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

export interface ApiClaimableReward {
  proposalId: string;
  title: string;
  amount: string; // claimable FOMA in wei
}

export async function fetchClaimableRewards(
  user: string,
): Promise<ApiClaimableReward[]> {
  const res = await fetch(`${API_BASE}/bets/claimable?user=${user}`);
  if (!res.ok)
    throw new Error(`Failed to fetch claimable rewards: ${res.status}`);
  return res.json();
}
