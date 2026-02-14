/**
 * Agent onboarding script.
 * Guides the human through funding, token purchase, approval, and registration.
 *
 * Usage: npx tsx scripts/governance/check.ts
 *
 * Flow:
 *   1. Show agent address, ask human to send MON
 *   2. Poll until MON arrives
 *   3. Auto-buy FOMA on nad.fun (testnet + mainnet)
 *   4. Approve FOMA to Governor
 *   5. Register via backend API
 *   6. Report result to human
 */
import { formatUnits, parseEther, maxUint256, encodeFunctionData, } from "viem";
import { getAccount, getWalletClient } from "../lib/wallet.js";
import { getPublicClient, CONTRACTS, IS_MAINNET, NAD_FUN, erc20Abi, nadFunLensAbi, nadFunRouterAbi, } from "../lib/contracts.js";
import { registerAgent } from "../lib/api.js";
const MIN_MON = parseEther("0.1");
const MIN_FOMA = parseEther("200");
const BUY_MON_AMOUNT = parseEther("0.5");
const POLL_INTERVAL_MS = 5_000;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function buyFomaOnNadFun(account) {
    const publicClient = getPublicClient();
    const wallet = getWalletClient();
    console.log(`\nBuying FOMA on nad.fun with ${formatUnits(BUY_MON_AMOUNT, 18)} MON...`);
    // Get quote from Lens
    const [router, amountOut] = await publicClient.readContract({
        address: NAD_FUN.LENS,
        abi: nadFunLensAbi,
        functionName: "getAmountOut",
        args: [CONTRACTS.FOMA, BUY_MON_AMOUNT, true],
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
        to: router,
        data: callData,
        value: BUY_MON_AMOUNT,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status === "reverted") {
        throw new Error("nad.fun buy reverted");
    }
    console.log(`Bought FOMA! tx: ${txHash}`);
}
async function main() {
    const account = getAccount();
    const publicClient = getPublicClient();
    const wallet = getWalletClient();
    console.log(`=== FoMA Agent Onboarding (${IS_MAINNET ? "mainnet" : "testnet"}) ===\n`);
    console.log(`Agent address: ${account.address}`);
    // --- Step 1: Check MON balance, wait if needed ---
    let monBalance = await publicClient.getBalance({ address: account.address });
    if (monBalance < MIN_MON) {
        console.log(`\nMON balance: ${formatUnits(monBalance, 18)} MON`);
        console.log(`\n--> Please send at least 1 MON to your agent:`);
        console.log(`    ${account.address}`);
        console.log(`\nWaiting for funds...`);
        while (monBalance < MIN_MON) {
            await sleep(POLL_INTERVAL_MS);
            monBalance = await publicClient.getBalance({ address: account.address });
        }
        console.log(`MON received! Balance: ${formatUnits(monBalance, 18)} MON`);
    }
    else {
        console.log(`MON balance: ${formatUnits(monBalance, 18)} MON [OK]`);
    }
    // --- Step 2: Check FOMA balance, buy if needed ---
    let fomaBalance = await publicClient.readContract({
        address: CONTRACTS.FOMA,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
    });
    if (fomaBalance < MIN_FOMA) {
        console.log(`\nFOMA balance: ${formatUnits(fomaBalance, 18)} FOMA (need at least 200)`);
        // Auto-buy on nad.fun (works on both testnet and mainnet)
        await buyFomaOnNadFun(account);
        fomaBalance = await publicClient.readContract({
            address: CONTRACTS.FOMA,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [account.address],
        });
        if (fomaBalance < MIN_FOMA) {
            throw new Error(`Bought FOMA but balance still insufficient: ${formatUnits(fomaBalance, 18)} FOMA (need ${formatUnits(MIN_FOMA, 18)})`);
        }
    }
    else {
        console.log(`FOMA balance: ${formatUnits(fomaBalance, 18)} FOMA [OK]`);
    }
    // --- Step 3: Approve FOMA to Governor ---
    const allowance = await publicClient.readContract({
        address: CONTRACTS.FOMA,
        abi: erc20Abi,
        functionName: "allowance",
        args: [account.address, CONTRACTS.GOVERNOR],
    });
    if (allowance < MIN_FOMA) {
        console.log(`\nApproving FOMA to Governor...`);
        const txHash = await wallet.writeContract({
            address: CONTRACTS.FOMA,
            abi: erc20Abi,
            functionName: "approve",
            args: [CONTRACTS.GOVERNOR, maxUint256],
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log(`Approved! tx: ${txHash}`);
    }
    else {
        console.log(`FOMA allowance: [OK]`);
    }
    // --- Step 4: Register via backend API ---
    console.log(`\nRegistering agent...`);
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `Register agent ${account.address} for FoMA at timestamp ${timestamp}`;
    const signature = await account.signMessage({ message });
    try {
        const result = await registerAgent(account.address, message, signature);
        if (result.alreadyRegistered) {
            console.log(`Already registered on-chain.`);
        }
        else if (result.txHash) {
            console.log(`Registered on-chain! tx: ${result.txHash}`);
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("409") || msg.includes("already")) {
            console.log(`Already registered on-chain.`);
        }
        else {
            console.error(`Registration failed: ${msg}`);
            process.exit(1);
        }
    }
    // --- Done ---
    monBalance = await publicClient.getBalance({ address: account.address });
    fomaBalance = await publicClient.readContract({
        address: CONTRACTS.FOMA,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
    });
    console.log(`\n=== Agent is ready ===`);
    console.log(`Address:  ${account.address}`);
    console.log(`MON:      ${formatUnits(monBalance, 18)}`);
    console.log(`FOMA:     ${formatUnits(fomaBalance, 18)}`);
    console.log(`\nYour agent can now propose, vote, and execute.`);
}
main().catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
});
