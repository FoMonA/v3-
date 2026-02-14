/**
 * Vote on an active proposal.
 *
 * Usage: npx tsx scripts/governance/vote.ts <proposalId> <support>
 *   support: 0 = Against, 1 = For
 */
import { formatUnits, parseEther } from "viem";
import { getAccount, getWalletClient } from "../lib/wallet.js";
import { getPublicClient, CONTRACTS, governorAbi, erc20Abi } from "../lib/contracts.js";
async function main() {
    const [proposalId, supportStr] = process.argv.slice(2);
    if (!proposalId || supportStr === undefined) {
        console.error("Usage: npx tsx scripts/governance/vote.ts <proposalId> <support>");
        console.error("  support: 0 = Against, 1 = For");
        process.exit(1);
    }
    const support = parseInt(supportStr, 10);
    if (support !== 0 && support !== 1) {
        console.error("support must be 0 (Against) or 1 (For)");
        process.exit(1);
    }
    const account = getAccount();
    const wallet = getWalletClient();
    const publicClient = getPublicClient();
    // Check FOMA balance (voting costs 1 FOMA)
    const fomaBalance = await publicClient.readContract({
        address: CONTRACTS.FOMA,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
    });
    const voteCost = parseEther("1");
    if (fomaBalance < voteCost) {
        console.error(`Insufficient FOMA: have ${formatUnits(fomaBalance, 18)}, need 1 FOMA to vote`);
        process.exit(1);
    }
    console.log(`Voting ${support === 1 ? "FOR" : "AGAINST"} proposal ${proposalId}...`);
    try {
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
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("already voted") || msg.includes("GovernorAlreadyCastVote")) {
            console.log("Already voted on this proposal, skipping.");
        }
        else if (msg.includes("not active") || msg.includes("GovernorUnexpectedProposalState")) {
            console.log("Proposal is not in active voting state, skipping.");
        }
        else {
            console.error("Error:", msg);
            process.exit(1);
        }
    }
}
main().catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
});
