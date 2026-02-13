import { useReadContract } from "wagmi";
import { CONTRACTS, bettingPoolAbi } from "@/lib/contracts";
import type { Address } from "viem";

export function useClaimable(
  proposalId: bigint,
  userAddress: Address | undefined,
) {
  return useReadContract({
    address: CONTRACTS.POOL,
    abi: bettingPoolAbi,
    functionName: "getClaimable",
    args: userAddress ? [proposalId, userAddress] : undefined,
    query: { enabled: proposalId > 0n && !!userAddress, refetchInterval: 10_000 },
  });
}
