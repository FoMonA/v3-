import { useCallback, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { CONTRACTS, bettingPoolAbi } from "@/lib/contracts";
import { showToast } from "@/lib/toast";

type ResolveStatus = "idle" | "resolving" | "confirmed" | "error";

export function useResolve(proposalId: bigint) {
  const { address } = useAccount();
  const [status, setStatus] = useState<ResolveStatus>("idle");
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const resolve = useCallback(async () => {
    if (!address) {
      showToast("error", "Wallet not connected", "Connect your wallet first");
      return;
    }

    try {
      setStatus("resolving");
      await writeContractAsync({
        address: CONTRACTS.POOL,
        abi: bettingPoolAbi,
        functionName: "resolve",
        args: [proposalId],
      });
      setStatus("confirmed");
      await queryClient.invalidateQueries({ queryKey: ["claimable-rewards"] });
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      showToast(
        "success",
        "Market resolved",
        "Winners can now claim their rewards",
      );
    } catch (error: unknown) {
      console.error("Resolve failed:", error);
      setStatus("error");
      showToast("error", "Resolve failed", "Transaction rejected or reverted");
    }
  }, [address, proposalId, queryClient, writeContractAsync]);

  return { resolve, status };
}
