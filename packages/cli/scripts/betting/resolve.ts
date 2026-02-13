/**
 * Resolve betting markets for completed proposals.
 * Fetches executed and defeated proposals, resolves any unresolved markets.
 *
 * Usage: npx tsx scripts/betting/resolve.ts [proposalId]
 */
import { getWalletClient } from "../lib/wallet.js";
import { getPublicClient, CONTRACTS, bettingPoolAbi } from "../lib/contracts.js";
import { fetchProposals, fetchProposal } from "../lib/api.js";

async function resolveMarket(proposal: {
  proposalId: string;
  title: string;
  resolved: boolean | null;
}) {
  if (proposal.resolved) {
    console.log(`  Already resolved: ${proposal.title}`);
    return false;
  }

  const wallet = getWalletClient();
  const publicClient = getPublicClient();

  console.log(`Resolving: ${proposal.title} (${proposal.proposalId.slice(0, 12)}...)`);

  const txHash = await wallet.writeContract({
    address: CONTRACTS.POOL,
    abi: bettingPoolAbi,
    functionName: "resolve",
    args: [BigInt(proposal.proposalId)],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status === "reverted") {
    console.error(`  Reverted!`);
    return false;
  }

  console.log(`  Resolved! tx: ${txHash}`);
  return true;
}

async function main() {
  const specificId = process.argv[2];

  if (specificId) {
    const proposal = await fetchProposal(specificId);
    await resolveMarket(proposal);
    return;
  }

  // Fetch executed + defeated proposals (both have final outcomes)
  const [executed, defeated] = await Promise.all([
    fetchProposals({ status: "executed" }),
    fetchProposals({ status: "defeated" }),
  ]);

  const unresolved = [...executed, ...defeated].filter((p) => !p.resolved);

  if (unresolved.length === 0) {
    console.log("No markets to resolve.");
    return;
  }

  console.log(`Found ${unresolved.length} market(s) to resolve.\n`);

  let resolved = 0;
  for (const proposal of unresolved) {
    try {
      const ok = await resolveMarket(proposal);
      if (ok) resolved++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  Skipped (${msg.includes("revert") ? "already resolved" : "error"})`);
    }
  }

  console.log(`\nResolved ${resolved}/${unresolved.length} markets.`);
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
