/**
 * Sell FOMA tokens on nad.fun.
 *
 * Usage: npx tsx scripts/trading/sell-foma.ts <fomaAmount>
 *   fomaAmount: Amount of FOMA to sell (in whole tokens, e.g. "100")
 */
import { formatUnits, parseEther, encodeFunctionData } from "viem";
import { getAccount, getWalletClient } from "../lib/wallet.js";
import {
  getPublicClient,
  CONTRACTS,
  NAD_FUN,
  erc20Abi,
  nadFunLensAbi,
  nadFunRouterAbi,
} from "../lib/contracts.js";

async function main() {
  const fomaAmountStr = process.argv[2];

  if (!fomaAmountStr) {
    console.error("Usage: npx tsx scripts/trading/sell-foma.ts <fomaAmount>");
    console.error("  fomaAmount: Amount of FOMA to sell (e.g. 100)");
    process.exit(1);
  }

  const fomaAmount = parseEther(fomaAmountStr);

  const account = getAccount();
  const publicClient = getPublicClient();
  const wallet = getWalletClient();

  // Check FOMA balance
  const balance = await publicClient.readContract({
    address: CONTRACTS.FOMA,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });

  if (balance < fomaAmount) {
    console.error(
      `Insufficient FOMA: have ${formatUnits(balance, 18)}, want to sell ${formatUnits(fomaAmount, 18)}`
    );
    process.exit(1);
  }

  console.log(`Selling ${formatUnits(fomaAmount, 18)} FOMA...`);

  // Get quote from Lens (isBuy = false for sell)
  const [router, amountOut] = await publicClient.readContract({
    address: NAD_FUN.LENS,
    abi: nadFunLensAbi,
    functionName: "getAmountOut",
    args: [CONTRACTS.FOMA, fomaAmount, false],
  });

  console.log(`Expected MON out: ${formatUnits(amountOut, 18)}`);
  console.log(`Router: ${router}`);

  // Approve router to spend FOMA
  const allowance = await publicClient.readContract({
    address: CONTRACTS.FOMA,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account.address, router],
  });

  if (allowance < fomaAmount) {
    console.log(`Approving FOMA to router...`);
    const approveTx = await wallet.writeContract({
      address: CONTRACTS.FOMA,
      abi: erc20Abi,
      functionName: "approve",
      args: [router, fomaAmount],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log(`Approved! tx: ${approveTx}`);
  }

  // 10% slippage
  const amountOutMin = (amountOut * 90n) / 100n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

  const callData = encodeFunctionData({
    abi: nadFunRouterAbi,
    functionName: "sell",
    args: [
      {
        amountIn: fomaAmount,
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
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status === "reverted") {
    console.error("Sell reverted!");
    process.exit(1);
  }

  console.log(`Sold FOMA! tx: ${txHash}`);
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
