import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther, UserRejectedRequestError, type Address } from "viem";
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
  const [status, setStatus] = useState<BuyStatus>("idle");
  const { writeContractAsync } = useWriteContract();
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

        await writeContractAsync({
          address: router as Address,
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
          value: parsed,
        });

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
        setStatus("error");
        const message =
          error instanceof Error ? error.message.split("\n")[0] : "Transaction failed";
        showToast("error", "Buy failed", message);
      }
    },
    [address, publicClient, writeContractAsync, queryClient],
  );

  const reset = useCallback(() => setStatus("idle"), []);

  return { buyFoma, status, reset };
}
