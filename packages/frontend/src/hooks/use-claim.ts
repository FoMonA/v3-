import { useCallback, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { CONTRACTS, bettingPoolAbi } from "@/lib/contracts";
import { showToast } from "@/lib/toast";
import type { ApiClaimableReward } from "@/lib/api";

type ClaimStatus = "idle" | "claiming" | "confirmed" | "error";

export function useClaim(proposalId: bigint) {
  const { address } = useAccount();
  const [status, setStatus] = useState<ClaimStatus>("idle");
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const claim = useCallback(async () => {
    if (!address) {
      showToast("error", "Wallet not connected", "Connect your wallet first");
      return;
    }

    const queryKey = ["claimable-rewards", address];
    const pid = proposalId.toString();

    try {
      setStatus("claiming");
      await writeContractAsync({
        address: CONTRACTS.POOL,
        abi: bettingPoolAbi,
        functionName: "claim",
        args: [proposalId],
      });

      // Optimistic update: remove claimed item from cache immediately
      queryClient.setQueryData<ApiClaimableReward[]>(queryKey, (old) =>
        old ? old.filter((r) => r.proposalId !== pid) : [],
      );

      setStatus("confirmed");
      showToast(
        "success",
        "Winnings claimed",
        "FOMA tokens sent to your wallet",
      );
    } catch (error: unknown) {
      setStatus("error");
      // Refetch to restore correct state on failure
      await queryClient.invalidateQueries({ queryKey });
      const message =
        error instanceof Error ? error.message : "Claim failed";
      showToast("error", "Claim failed", message);
    }
  }, [address, proposalId, writeContractAsync, queryClient]);

  const reset = useCallback(() => setStatus("idle"), []);

  return { claim, status, reset };
}
