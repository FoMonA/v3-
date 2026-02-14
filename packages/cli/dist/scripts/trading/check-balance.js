/**
 * Check MON and FOMA balances for the agent wallet.
 *
 * Usage: npx tsx scripts/trading/check-balance.ts
 */
import { formatUnits } from "viem";
import { getAccount } from "../lib/wallet.js";
import { getPublicClient, CONTRACTS, IS_MAINNET, erc20Abi } from "../lib/contracts.js";
async function main() {
    const account = getAccount();
    const publicClient = getPublicClient();
    console.log(`=== Balance Check (${IS_MAINNET ? "mainnet" : "testnet"}) ===\n`);
    console.log(`Address: ${account.address}`);
    const [monBalance, fomaBalance] = await Promise.all([
        publicClient.getBalance({ address: account.address }),
        publicClient.readContract({
            address: CONTRACTS.FOMA,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [account.address],
        }),
    ]);
    console.log(`MON:  ${formatUnits(monBalance, 18)}`);
    console.log(`FOMA: ${formatUnits(fomaBalance, 18)}`);
    // Warnings
    const monFloat = parseFloat(formatUnits(monBalance, 18));
    const fomaFloat = parseFloat(formatUnits(fomaBalance, 18));
    if (monFloat < 0.1) {
        console.log(`\nWARNING: MON balance below 0.1 -- you need gas to submit transactions`);
    }
    if (fomaFloat < 50) {
        console.log(`\nWARNING: FOMA balance below 50 -- you need tokens to vote and propose`);
    }
}
main().catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
});
