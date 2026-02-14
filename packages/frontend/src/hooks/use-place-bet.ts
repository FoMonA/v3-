import { useCallback, useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { CONTRACTS, fomaTokenAbi, bettingPoolAbi } from "@/lib/contracts";
import { showToast } from "@/lib/toast";

type BetStatus = "idle" | "approving" | "betting" | "confirmed" | "error";

export function usePlaceBet(proposalId: bigint) {
  const { address } = useAccount();
  const [status, setStatus] = useState<BetStatus>("idle");
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const { data: rawAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.FOMA,
    abi: fomaTokenAbi,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.POOL] : undefined,
    query: { enabled: !!address },
  });

  const placeBet = useCallback(
    async (yesOrNo: boolean, amount: bigint) => {
      if (!address) {
        showToast("error", "Wallet not connected", "Connect your wallet first");
        return;
      }

      try {
        const currentAllowance = BigInt((rawAllowance as bigint) ?? 0n);
        if (currentAllowance < amount) {
          setStatus("approving");
          await writeContractAsync({
            address: CONTRACTS.FOMA,
            abi: fomaTokenAbi,
            functionName: "approve",
            args: [CONTRACTS.POOL, amount],
          });
          await refetchAllowance();
        }

        setStatus("betting");
        await writeContractAsync({
          address: CONTRACTS.POOL,
          abi: bettingPoolAbi,
          functionName: "bet",
          args: [proposalId, yesOrNo, amount],
        });

        setStatus("confirmed");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["proposals"] }),
          queryClient.invalidateQueries({ queryKey: ["stats"] }),
        ]);
        showToast(
          "success",
          "Bet placed",
          `You bet ${yesOrNo ? "YES" : "NO"} on proposal #${proposalId.toString()}`,
        );
      } catch (error: unknown) {
        setStatus("error");
        const message =
          error instanceof Error ? error.message : "Transaction failed";
        showToast("error", "Bet failed", message);
      }
    },
    [address, rawAllowance, proposalId, writeContractAsync, refetchAllowance],
  );

  const reset = useCallback(() => setStatus("idle"), []);

  return { placeBet, status, reset };
}
