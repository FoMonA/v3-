/**
 * Buy FOMA tokens on nad.fun.
 *
 * Usage: npx tsx scripts/trading/buy-foma.ts [monAmount]
 *   monAmount: Amount of MON to spend (default: 0.5)
 */
import { formatUnits, parseEther, encodeFunctionData } from "viem";
import { getAccount, getWalletClient } from "../lib/wallet.js";
import { getPublicClient, CONTRACTS, NAD_FUN, nadFunLensAbi, nadFunRouterAbi, } from "../lib/contracts.js";
async function main() {
    const monAmountStr = process.argv[2] ?? "0.5";
    const monAmount = parseEther(monAmountStr);
    const account = getAccount();
    const publicClient = getPublicClient();
    const wallet = getWalletClient();
    // Check MON balance
    const monBalance = await publicClient.getBalance({ address: account.address });
    if (monBalance < monAmount) {
        console.error(`Insufficient MON: have ${formatUnits(monBalance, 18)}, need ${formatUnits(monAmount, 18)}`);
        process.exit(1);
    }
    console.log(`Buying FOMA with ${formatUnits(monAmount, 18)} MON...`);
    // Get quote from Lens
    const [router, amountOut] = await publicClient.readContract({
        address: NAD_FUN.LENS,
        abi: nadFunLensAbi,
        functionName: "getAmountOut",
        args: [CONTRACTS.FOMA, monAmount, true],
    });
    console.log(`Expected FOMA out: ${formatUnits(amountOut, 18)}`);
    console.log(`Router: ${router}`);
    // 10% slippage
    const amountOutMin = (amountOut * 90n) / 100n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
    const callData = encodeFunctionData({
        abi: nadFunRouterAbi,
        functionName: "buy",
        args: [
            {
                amountOutMin,
                token: CONTRACTS.FOMA,
                to: account.address,
                deadline,
            },
        ],
    });
    const txHash = await wallet.sendTransaction({
        to: router,
        data: callData,
        value: monAmount,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status === "reverted") {
        console.error("Buy reverted!");
        process.exit(1);
    }
    console.log(`Bought FOMA! tx: ${txHash}`);
}
main().catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
});
