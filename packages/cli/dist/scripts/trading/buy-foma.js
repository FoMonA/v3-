/**
 * Buy FOMA tokens to reach a target balance.
 *
 * Usage: npx tsx scripts/trading/buy-foma.ts <targetFoma>
 *   targetFoma: Desired FOMA balance (e.g. 50000). Buys the deficit.
 */
import { formatUnits, parseEther, encodeFunctionData } from "viem";
import { getAccount, getWalletClient } from "../lib/wallet.js";
import { getPublicClient, CONTRACTS, NAD_FUN, CHAIN, erc20Abi, nadFunLensAbi, nadFunRouterAbi, } from "../lib/contracts.js";
async function main() {
    const targetStr = process.argv[2];
    if (!targetStr) {
        console.error("Usage: npx tsx scripts/trading/buy-foma.ts <targetFoma>");
        process.exit(1);
    }
    const targetFoma = parseFloat(targetStr);
    const account = getAccount();
    const publicClient = getPublicClient();
    const wallet = getWalletClient();
    // Check current FOMA balance
    const fomaBalance = await publicClient.readContract({
        address: CONTRACTS.FOMA,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
    });
    const currentFoma = parseFloat(formatUnits(fomaBalance, 18));
    console.log(`Current FOMA: ${currentFoma.toFixed(2)}`);
    console.log(`Target FOMA:  ${targetFoma}`);
    if (currentFoma >= targetFoma) {
        console.log(`Already at or above target. No purchase needed.`);
        return;
    }
    const deficit = targetFoma - currentFoma;
    console.log(`Deficit:      ${deficit.toFixed(2)} FOMA`);
    // Get rate by quoting 0.01 MON
    const probeMon = parseEther("0.01");
    const [router, probeOut] = await publicClient.readContract({
        address: NAD_FUN.LENS,
        abi: nadFunLensAbi,
        functionName: "getAmountOut",
        args: [CONTRACTS.FOMA, probeMon, true],
    });
    const probeOutFloat = parseFloat(formatUnits(probeOut, 18));
    if (probeOutFloat <= 0) {
        console.error("Could not get FOMA price from Lens.");
        process.exit(1);
    }
    // Rate: FOMA per MON
    const rate = probeOutFloat / 0.01;
    const monNeeded = deficit / rate;
    // Add 15% buffer for slippage and price movement
    const monToSpend = monNeeded * 1.15;
    console.log(`Rate:         ~${rate.toFixed(2)} FOMA/MON`);
    console.log(`MON needed:   ${monNeeded.toFixed(6)} (+ 15% buffer = ${monToSpend.toFixed(6)})`);
    // Check MON balance
    const monBalance = await publicClient.getBalance({ address: account.address });
    const monFloat = parseFloat(formatUnits(monBalance, 18));
    // Keep at least 0.05 MON for gas
    const maxSpend = monFloat - 0.05;
    if (maxSpend <= 0) {
        console.error(`Not enough MON for gas. Have ${monFloat.toFixed(4)} MON.`);
        process.exit(1);
    }
    const actualSpend = Math.min(monToSpend, maxSpend);
    const monAmount = parseEther(actualSpend.toFixed(18));
    console.log(`\nBuying FOMA with ${actualSpend.toFixed(6)} MON...`);
    // Get exact quote for the actual spend amount
    const [finalRouter, amountOut] = await publicClient.readContract({
        address: NAD_FUN.LENS,
        abi: nadFunLensAbi,
        functionName: "getAmountOut",
        args: [CONTRACTS.FOMA, monAmount, true],
    });
    console.log(`Expected FOMA out: ${formatUnits(amountOut, 18)}`);
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
        to: finalRouter,
        data: callData,
        value: monAmount,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status === "reverted") {
        console.error("Buy reverted!");
        process.exit(1);
    }
    const explorer = CHAIN.blockExplorers?.default?.url ?? "https://testnet.monadexplorer.com";
    console.log(`Bought FOMA! tx: ${txHash}`);
    console.log(`Explorer: ${explorer}/tx/${txHash}`);
}
main().catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
});
