import { useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { CategoryFilter } from "./category-filter";
import { ProposalCard } from "./proposal-card";
import { useProposals } from "@/hooks/use-proposals";
import { cn } from "@/lib/utils";
import { Flame, Loader2, ArrowUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/lib/api";
import { ProposalCardSkeleton } from "@/components/skeletons/proposal-card-skeleton";
import { useReadContract } from "wagmi";
import { CONTRACTS, governorAbi } from "@/lib/contracts";

const PAGE_SIZE = 5;

interface ProposalListProps {
  className?: string;
  sidebar?: ReactNode;
}

export function ProposalList({ className, sidebar }: ProposalListProps) {
  const [categoryFilter, setCategoryFilter] = useState(-1);
  const {
    data: proposals,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    refetchOnChain,
  } = useProposals(
    categoryFilter === -1 ? undefined : categoryFilter,
    PAGE_SIZE,
  );

  const { data: rawBlock } = useReadContract({
    address: CONTRACTS.GOVERNOR,
    abi: governorAbi,
    functionName: "clock",
    query: { refetchInterval: 5_000 },
  });
  const currentBlock =
    typeof rawBlock === "bigint"
      ? rawBlock
      : typeof rawBlock === "number"
        ? BigInt(rawBlock)
        : undefined;

  // Track proposal count from stats to detect new proposals
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 15_000,
  });

  const knownCountRef = useRef<number | null>(null);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (stats?.proposalCount === undefined || isLoading) return;
    // Initialize only after proposals have loaded so ref matches displayed data
    if (knownCountRef.current === null) {
      knownCountRef.current = stats.proposalCount;
      return;
    }
    const diff = stats.proposalCount - knownCountRef.current;
    if (diff > 0) {
      setNewCount(diff);
    }
  }, [stats?.proposalCount, isLoading]);

  const handleLoadNew = useCallback(async () => {
    knownCountRef.current = stats?.proposalCount ?? knownCountRef.current;
    setNewCount(0);
    await refetch();
  }, [refetch, stats?.proposalCount]);

  const hasMore = hasNextPage ?? false;

  // IntersectionObserver via ref callback (no useEffect)
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !hasMore || isFetchingNextPage) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchNextPage();
          }
        },
        { rootMargin: "200px" },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [fetchNextPage, hasMore, isFetchingNextPage],
  );

  return (
    <section
      id="proposals"
      className={cn("mt-12 scroll-mt-[120px] space-y-6", className)}
    >
      {/* Heading + filters span full width above the grid */}
      <div className="flex items-center gap-3">
        <Flame className="size-8 text-primary" />
        <h2 className="font-mono text-4xl font-semibold uppercase tracking-widest text-foreground">
          Proposals
        </h2>
      </div>

      <CategoryFilter selected={categoryFilter} onSelect={setCategoryFilter} />

      {/* 2-column grid: cards on left, sidebar on right */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[2fr_1fr]">
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProposalCardSkeleton key={i} />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="grid gap-4">
            <div className="glass-card px-6 py-12 text-center font-mono text-sm text-foreground/30">
              No proposals in this category
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {newCount > 0 && (
              <button
                type="button"
                onClick={handleLoadNew}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5 font-mono text-xs font-bold text-primary transition-colors hover:bg-primary/10"
              >
                <ArrowUp className="size-3.5" />
                {newCount} new proposal{newCount > 1 ? "s" : ""}
              </button>
            )}
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id.toString()}
                proposal={proposal}
                currentBlock={currentBlock}
                onMarketChange={refetchOnChain}
              />
            ))}
            {(hasMore || isFetchingNextPage) && (
              <div
                ref={sentinelRef}
                className="flex items-center justify-center py-6"
              >
                <Loader2 className="size-5 animate-spin text-foreground/20" />
              </div>
            )}
          </div>
        )}

        {sidebar}
      </div>
    </section>
  );
}
