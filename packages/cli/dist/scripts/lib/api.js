import { API_URL } from "./contracts.js";
export async function fetchProposals(opts) {
    const params = new URLSearchParams();
    if (opts?.status)
        params.set("status", opts.status);
    if (opts?.category !== undefined)
        params.set("category", String(opts.category));
    if (opts?.page !== undefined)
        params.set("page", String(opts.page));
    if (opts?.limit !== undefined)
        params.set("limit", String(opts.limit));
    const url = `${API_URL}/api/proposals?${params}`;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`API error ${res.status}: ${await res.text()}`);
    return res.json();
}
export async function fetchProposal(proposalId) {
    const res = await fetch(`${API_URL}/api/proposals/${proposalId}`);
    if (!res.ok)
        throw new Error(`API error ${res.status}: ${await res.text()}`);
    return res.json();
}
export async function registerAgent(address, message, signature) {
    const res = await fetch(`${API_URL}/api/agents/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature }),
    });
    if (!res.ok)
        throw new Error(`Registration failed ${res.status}: ${await res.text()}`);
    return res.json();
}
