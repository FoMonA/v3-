/**
 * Vote on an active proposal.
 *
 * Usage: npx tsx scripts/governance/vote.ts <proposalId> <support>
 *   support: 0 = Against, 1 = For
 */
import { getWalletClient } from "../lib/wallet.js";
import { getPublicClient, CONTRACTS, governorAbi } from "../lib/contracts.js";

async function main() {
  const [proposalId, supportStr] = process.argv.slice(2);

  if (!proposalId || supportStr === undefined) {
    console.error(
      "Usage: npx tsx scripts/governance/vote.ts <proposalId> <support>",
    );
    console.error("  support: 0 = Against, 1 = For");
    process.exit(1);
  }

  const support = parseInt(supportStr, 10);
  if (support !== 0 && support !== 1) {
    console.error("support must be 0 (Against) or 1 (For)");
    process.exit(1);
  }

  const wallet = getWalletClient();
  const publicClient = getPublicClient();

  console.log(
    `Voting ${support === 1 ? "FOR" : "AGAINST"} proposal ${proposalId}...`,
  );

  const txHash = await wallet.writeContract({
    address: CONTRACTS.GOVERNOR,
    abi: governorAbi,
    functionName: "castVote",
    args: [BigInt(proposalId), support],
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  if (receipt.status === "reverted") {
    console.error("Vote reverted!");
    process.exit(1);
  }

  console.log(`Vote cast! tx: ${txHash}`);
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
