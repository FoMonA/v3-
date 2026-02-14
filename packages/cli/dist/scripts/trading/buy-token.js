/**
 * Buy any token on nad.fun.
 *
 * Usage: npx tsx scripts/trading/buy-token.ts <tokenAddress> [monAmount]
 *   tokenAddress: The token contract address
 *   monAmount: Amount of MON to spend (default: 0.1)
 */
import { formatUnits, parseEther, encodeFunctionData } from "viem";
import { getAccount, getWalletClient } from "../lib/wallet.js";
import { getPublicClient, NAD_FUN, nadFunLensAbi, nadFunRouterAbi, } from "../lib/contracts.js";
async function main() {
    const tokenAddress = process.argv[2];
    const monAmountStr = process.argv[3] ?? "0.1";
    if (!tokenAddress) {
        console.error("Usage: npx tsx scripts/trading/buy-token.ts <tokenAddress> [monAmount]");
        console.error("  tokenAddress: The token contract address");
        console.error("  monAmount: Amount of MON to spend (default: 0.1)");
        process.exit(1);
    }
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
    console.log(`Buying token ${tokenAddress} with ${formatUnits(monAmount, 18)} MON...`);
    // Get quote from Lens
    const [router, amountOut] = await publicClient.readContract({
        address: NAD_FUN.LENS,
        abi: nadFunLensAbi,
        functionName: "getAmountOut",
        args: [tokenAddress, monAmount, true],
    });
    console.log(`Expected tokens out: ${formatUnits(amountOut, 18)}`);
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
                token: tokenAddress,
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
    console.log(`Bought token! tx: ${txHash}`);
}
main().catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
});
