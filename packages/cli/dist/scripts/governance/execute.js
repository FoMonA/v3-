/**
 * Execute succeeded proposals.
 * Fetches proposals with status=succeeded from the API and executes them.
 *
 * Usage: npx tsx scripts/governance/execute.ts [proposalId]
 *   If proposalId is provided, executes that specific proposal.
 *   If omitted, fetches all succeeded proposals and executes them.
 */
import { keccak256, toBytes } from "viem";
import { getWalletClient } from "../lib/wallet.js";
import { getPublicClient, CONTRACTS, governorAbi } from "../lib/contracts.js";
import { fetchProposals, fetchProposal } from "../lib/api.js";
async function executeProposal(proposal) {
    const wallet = getWalletClient();
    const publicClient = getPublicClient();
    // Reconstruct original description: "Title\nBody"
    const fullDescription = proposal.description
        ? `${proposal.title}\n${proposal.description}`
        : proposal.title;
    const descriptionHash = keccak256(toBytes(fullDescription));
    console.log(`Executing: ${proposal.title} (${proposal.proposalId.slice(0, 12)}...)`);
    const txHash = await wallet.writeContract({
        address: CONTRACTS.GOVERNOR,
        abi: governorAbi,
        functionName: "execute",
        args: [
            [CONTRACTS.GOVERNOR],
            [0n],
            ["0x"],
            descriptionHash,
        ],
    });
    const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
    });
    if (receipt.status === "reverted") {
        console.error(`  Reverted!`);
        return false;
    }
    console.log(`  Executed! tx: ${txHash}`);
    return true;
}
async function main() {
    const specificId = process.argv[2];
    if (specificId) {
        const proposal = await fetchProposal(specificId);
        await executeProposal(proposal);
        return;
    }
    // Fetch all succeeded proposals
    const proposals = await fetchProposals({ status: "succeeded" });
    if (proposals.length === 0) {
        console.log("No proposals to execute.");
        return;
    }
    console.log(`Found ${proposals.length} proposal(s) to execute.\n`);
    let executed = 0;
    for (const proposal of proposals) {
        try {
            const ok = await executeProposal(proposal);
            if (ok)
                executed++;
        }
        catch (err) {
            // Another agent already executed it, or state changed
            const msg = err instanceof Error ? err.message : String(err);
            console.log(`  Skipped (${msg.includes("revert") ? "already executed" : "error"})`);
        }
    }
    console.log(`\nExecuted ${executed}/${proposals.length} proposals.`);
}
main().catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
});
