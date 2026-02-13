import { API_URL } from "./contracts.js";

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

type ProposalStatus =
  | "pending"
  | "active"
  | "defeated"
  | "succeeded"
  | "executed";

export async function fetchProposals(opts?: {
  status?: ProposalStatus;
  category?: number;
  page?: number;
  limit?: number;
}): Promise<Proposal[]> {
  const params = new URLSearchParams();
  if (opts?.status) params.set("status", opts.status);
  if (opts?.category !== undefined)
    params.set("category", String(opts.category));
  if (opts?.page !== undefined) params.set("page", String(opts.page));
  if (opts?.limit !== undefined) params.set("limit", String(opts.limit));

  const url = `${API_URL}/api/v2/proposals?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<Proposal[]>;
}

export async function fetchProposal(proposalId: string): Promise<Proposal> {
  const res = await fetch(`${API_URL}/api/v2/proposals/${proposalId}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<Proposal>;
}

export async function registerAgent(
  address: string,
  message: string,
  signature: string,
): Promise<{ success: boolean; txHash?: string; alreadyRegistered?: boolean }> {
  const res = await fetch(`${API_URL}/api/v2/agents/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, message, signature }),
  });
  if (!res.ok)
    throw new Error(`Registration failed ${res.status}: ${await res.text()}`);
  return res.json();
}
