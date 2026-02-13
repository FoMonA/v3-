import { useReadContract } from "wagmi";
import { CONTRACTS, bettingPoolAbi } from "@/lib/contracts";

export function useMarket(proposalId: bigint): ReturnType<typeof useReadContract> & { refetch: () => Promise<unknown> } {
  return useReadContract({
    address: CONTRACTS.POOL,
    abi: bettingPoolAbi,
    functionName: "markets",
    args: [proposalId],
    query: {
      enabled: proposalId > 0n,
      refetchInterval: 10_000,
    },
  });
  // Returns tuple: [exists, resolved, outcome, totalYes, totalNo, platformFeeAmount]
}
