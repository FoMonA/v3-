import { Skeleton } from "@/components/ui/skeleton";

export function ProposalCardSkeleton() {
  return (
    <div className="glass-card space-y-6 p-7">
      {/* Header: category badge + status + cost */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Title + description */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Meta row: proposer + reward */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Agent Vote section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      {/* VS Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-foreground/5" />
        <Skeleton className="h-5 w-8 rounded-full" />
        <div className="h-px flex-1 bg-foreground/5" />
      </div>

      {/* Human Bet section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
    </div>
  );
}
