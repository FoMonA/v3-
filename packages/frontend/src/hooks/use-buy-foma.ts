import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useConfig } from "wagmi";
import { getWalletClient, switchChain } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther, encodeFunctionData, UserRejectedRequestError, type Address } from "viem";
import { monadChain } from "@/lib/wagmi";
import {
  CONTRACTS,
  NAD_FUN,
  nadFunLensAbi,
  nadFunRouterAbi,
} from "@/lib/contracts";
import { showToast } from "@/lib/toast";
import { formatFoma } from "@/lib/format";

type BuyStatus = "idle" | "quoting" | "buying" | "confirmed" | "error";

export function useBuyFoma() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const config = useConfig();
  const [status, setStatus] = useState<BuyStatus>("idle");
  const queryClient = useQueryClient();

  const buyFoma = useCallback(
    async (monAmount: string) => {
      if (!address) {
        showToast("error", "Wallet not connected", "Connect your wallet first");
        return;
      }

      const parsed = parseEther(monAmount);
      if (parsed <= 0n) {
        showToast("error", "Invalid amount", "Enter a positive MON amount");
        return;
      }

      try {
        setStatus("quoting");

        const [router, amountOut] = await publicClient!.readContract({
          address: NAD_FUN.LENS,
          abi: nadFunLensAbi,
          functionName: "getAmountOut",
          args: [CONTRACTS.FOMA, parsed, true],
        });

        const amountOutMin = (amountOut * 90n) / 100n; // 10% slippage
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min

        setStatus("buying");

        await switchChain(config, { chainId: monadChain.id });
        const walletClient = await getWalletClient(config);

        const callData = encodeFunctionData({
          abi: nadFunRouterAbi,
          functionName: "buy",
          args: [
            {
              amountOutMin,
              token: CONTRACTS.FOMA,
              to: address,
              deadline,
            },
          ],
        });

        const hash = await walletClient.sendTransaction({
          chain: monadChain,
          to: router as Address,
          data: callData,
          value: parsed,
        });

        const receipt = await publicClient!.waitForTransactionReceipt({ hash });
        if (receipt.status === "reverted") {
          throw new Error("Transaction reverted");
        }

        setStatus("confirmed");
        await queryClient.invalidateQueries({ queryKey: ["readContract"] });
        const fomaReceived = formatFoma(amountOutMin);
        showToast("success", "FOMA purchased", `Spent ${monAmount} MON for ~${fomaReceived} FOMA`);
      } catch (error: unknown) {
        if (error instanceof UserRejectedRequestError || (error instanceof Error && error.message.includes("User rejected"))) {
          setStatus("idle");
          showToast("warning", "Transaction cancelled", "You rejected the transaction");
          return;
        }
        console.error("Buy failed:", error);
        setStatus("error");
        const msg = error instanceof Error ? error.message.slice(0, 100) : "Unknown error";
        showToast("error", "Buy failed", msg);
      }
    },
    [address, publicClient, config, queryClient],
  );

  const reset = useCallback(() => setStatus("idle"), []);

  return { buyFoma, status, reset };
}
