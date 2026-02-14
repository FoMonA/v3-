import { useReadContracts } from "wagmi";
import { CONTRACTS, bettingPoolAbi } from "@/lib/contracts";
import type { Address } from "viem";
import type { UserBetPosition } from "@/lib/types";

export function useUserBet(
  proposalId: bigint,
  userAddress: Address | undefined,
): { data: UserBetPosition | undefined; isLoading: boolean; refetch: () => Promise<unknown> } {
  const enabled = proposalId > 0n && !!userAddress;

  const result = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.POOL,
        abi: bettingPoolAbi,
        functionName: "yesBets",
        args: enabled ? [proposalId, userAddress!] : undefined,
      },
      {
        address: CONTRACTS.POOL,
        abi: bettingPoolAbi,
        functionName: "noBets",
        args: enabled ? [proposalId, userAddress!] : undefined,
      },
    ],
    query: { enabled, refetchInterval: 10_000 },
  });

  const yesBet = (result.data?.[0]?.result as bigint | undefined) ?? 0n;
  const noBet = (result.data?.[1]?.result as bigint | undefined) ?? 0n;
  const hasBet = yesBet > 0n || noBet > 0n;
  const side = yesBet > 0n ? ("yes" as const) : noBet > 0n ? ("no" as const) : null;

  return {
    data: result.data ? { yesBet, noBet, hasBet, side } : undefined,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}
