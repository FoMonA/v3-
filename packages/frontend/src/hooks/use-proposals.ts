import { useMemo, useEffect, useRef } from "react";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { useReadContracts } from "wagmi";
import type { Proposal, Market } from "@/lib/types";
import type { ProposalState } from "@/lib/types";
import type { Address } from "viem";
import { fetchProposals } from "@/lib/api";
import { CONTRACTS, governorAbi, bettingPoolAbi } from "@/lib/contracts";
import { CATEGORIES } from "@/lib/constants";

const CALLS_PER_PROPOSAL = 6;
type MarketTuple = readonly [boolean, boolean, boolean, bigint, bigint, bigint];
const isSamePrefix = (
  current: readonly string[],
  previous: readonly string[],
) => {
  if (previous.length === 0) return false;
  if (current.length < previous.length) return false;
  for (let i = 0; i < previous.length; i += 1) {
    if (current[i] !== previous[i]) return false;
  }
  return true;
};

export function useProposals(categoryFilter?: number, pageSize = 5) {
  const {
    data: apiPages,
    isLoading: apiLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["proposals", categoryFilter, pageSize],
    queryFn: ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 0;
      return fetchProposals({
        category: categoryFilter,
        page,
        limit: pageSize,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length;
    },
    staleTime: Infinity,
  });

  const apiProposals = useMemo(
    () => apiPages?.pages.flat() ?? [],
    [apiPages],
  );

  const proposalIds = useMemo(
    () => apiProposals.map((proposal) => proposal.proposalId),
    [apiProposals],
  );
  const previousProposalIdsRef = useRef<readonly string[]>([]);
  const shouldKeepOnChainData = isSamePrefix(
    proposalIds,
    previousProposalIdsRef.current,
  );

  useEffect(() => {
    previousProposalIdsRef.current = proposalIds;
  }, [proposalIds]);

  // Build multicall for on-chain hydration: state + votes + fees + deadlines + market
  const contracts = useMemo(() => {
    if (!apiProposals?.length) return [];
    return apiProposals.flatMap((p) => {
      const id = BigInt(p.proposalId);
      return [
        {
          address: CONTRACTS.GOVERNOR,
          abi: governorAbi,
          functionName: "state" as const,
          args: [id] as const,
        },
        {
          address: CONTRACTS.GOVERNOR,
          abi: governorAbi,
          functionName: "proposalVotes" as const,
          args: [id] as const,
        },
        {
          address: CONTRACTS.GOVERNOR,
          abi: governorAbi,
          functionName: "votingFees" as const,
          args: [id] as const,
        },
        {
          address: CONTRACTS.GOVERNOR,
          abi: governorAbi,
          functionName: "proposalDeadline" as const,
          args: [id] as const,
        },
        {
          address: CONTRACTS.GOVERNOR,
          abi: governorAbi,
          functionName: "proposalSnapshot" as const,
          args: [id] as const,
        },
        {
          address: CONTRACTS.POOL,
          abi: bettingPoolAbi,
          functionName: "markets" as const,
          args: [id] as const,
        },
      ];
    });
  }, [apiProposals]);

  const { data: onChainData, refetch: refetchOnChain } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
      refetchInterval: 10_000,
      // Keep previous data only for pagination appends to avoid mismatched bars
      placeholderData: shouldKeepOnChainData ? keepPreviousData : undefined,
    },
  });

  const proposals: Proposal[] = useMemo(() => {
    if (!apiProposals?.length) return [];

    return apiProposals.map((ap, idx) => {
      const base = idx * CALLS_PER_PROPOSAL;

      // On-chain data: state, proposalVotes, votingFees, deadline, snapshot, market
      const stateResult = onChainData?.[base]?.result;
      const votesResult = onChainData?.[base + 1]?.result;
      const feesResult = onChainData?.[base + 2]?.result;
      const deadlineResult = onChainData?.[base + 3]?.result;
      const snapshotResult = onChainData?.[base + 4]?.result;
      const marketResult = onChainData?.[base + 5]?.result;

      const state = (typeof stateResult === "number" ? stateResult : 0) as ProposalState;

      // OZ GovernorCountingSimple: returns (againstVotes, forVotes, abstainVotes)
      const votes = votesResult as readonly [bigint, bigint, bigint] | undefined;
      const againstVotes = votes?.[0] ?? 0n;
      const forVotes = votes?.[1] ?? 0n;
      const abstainVotes = votes?.[2] ?? 0n;

      const votingFees = typeof feesResult === "bigint" ? feesResult : 0n;
      const deadline = typeof deadlineResult === "bigint" ? deadlineResult : BigInt(ap.voteEnd);
      const snapshot = typeof snapshotResult === "bigint" ? snapshotResult : BigInt(ap.voteStart);
      const marketTuple = marketResult as MarketTuple | undefined;
      const market: Market = marketTuple
        ? {
            exists: marketTuple[0],
            resolved: marketTuple[1],
            outcome: marketTuple[2],
            totalYes: marketTuple[3],
            totalNo: marketTuple[4],
            platformFeeAmount: marketTuple[5],
          }
        : {
            exists: false,
            resolved: false,
            outcome: false,
            totalYes: 0n,
            totalNo: 0n,
            platformFeeAmount: 0n,
          };

      const categoryName = CATEGORIES[ap.categoryId] ?? "Unknown";

      return {
        id: BigInt(ap.proposalId),
        title: ap.title,
        description: ap.description,
        proposer: ap.proposer as Address,
        categoryId: ap.categoryId,
        categoryName,
        state,
        cost: BigInt(ap.cost),
        votingFees,
        forVotes,
        againstVotes,
        abstainVotes,
        deadline,
        snapshot,
        market,
      };
    });
  }, [apiProposals, onChainData]);

  return {
    data: proposals,
    isLoading: apiLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    refetchOnChain,
  };
}
