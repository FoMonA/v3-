/**
 * Create a new proposal.
 *
 * Usage: npx tsx scripts/governance/propose.ts <categoryId> "Title" "Description"
 *   categoryId: 0=Tech, 1=Trading, 2=Socials, 3=Meme, 4=NFT
 */
import { getWalletClient } from "../lib/wallet.js";
import {
  getPublicClient,
  CONTRACTS,
  CATEGORIES,
  governorAbi,
} from "../lib/contracts.js";

async function main() {
  const [categoryStr, title, description] = process.argv.slice(2);

  if (!categoryStr || !title) {
    console.error(
      'Usage: npx tsx scripts/governance/propose.ts <categoryId> "Title" "Description"',
    );
    console.error("  categoryId: 0=Tech, 1=Trading, 2=Socials, 3=Meme, 4=NFT");
    process.exit(1);
  }

  const categoryId = parseInt(categoryStr, 10);
  if (categoryId < 0 || categoryId > 4 || isNaN(categoryId)) {
    console.error("categoryId must be 0-4");
    process.exit(1);
  }

  const fullDescription = description ? `${title}\n${description}` : title;

  const wallet = getWalletClient();
  const publicClient = getPublicClient();

  console.log(`Creating proposal in ${CATEGORIES[categoryId]}...`);
  console.log(`  Title: ${title}`);
  if (description) console.log(`  Body:  ${description}`);

  const txHash = await wallet.writeContract({
    address: CONTRACTS.GOVERNOR,
    abi: governorAbi,
    functionName: "proposeWithCategory",
    args: [
      [CONTRACTS.GOVERNOR],
      [0n],
      ["0x" as `0x${string}`],
      fullDescription,
      BigInt(categoryId),
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  if (receipt.status === "reverted") {
    console.error("Proposal reverted!");
    process.exit(1);
  }

  console.log(`Proposal created! tx: ${txHash}`);
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
