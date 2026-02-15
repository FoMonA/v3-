import { cn } from "@/lib/utils";
import { formatUnits } from "viem";

interface VoteProgressProps {
  forVotes: bigint;
  againstVotes: bigint;
  className?: string;
}

export function VoteProgress({
  forVotes,
  againstVotes,
  className,
}: VoteProgressProps) {
  const total = forVotes + againstVotes;
  const hasVotes = total > 0n;
  const forPercent = hasVotes
    ? Number((forVotes * 10000n) / total) / 100
    : 0;
  const againstPercent = hasVotes ? 100 - forPercent : 0;

  const forDisplay = hasVotes ? formatUnits(forVotes, 18) : "0";
  const againstDisplay = hasVotes ? formatUnits(againstVotes, 18) : "0";

  if (!hasVotes) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="text-center font-mono text-xs text-foreground/50">
          No votes cast
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Labels row */}
      <div className="flex items-center justify-between">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="size-2 rounded-full bg-secondary" />
          <span className="font-mono text-xs font-medium text-secondary">
            FOR {forPercent.toFixed(1)}%
          </span>
        </div>
        <span className="truncate px-2 font-mono text-[11px] font-medium text-foreground/30">
          {forDisplay} vs {againstDisplay}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="font-mono text-xs font-medium text-foreground/40">
            {againstPercent.toFixed(1)}% AGAINST
          </span>
          <span className="size-2 rounded-full bg-foreground/30" />
        </div>
      </div>

      {/* Tug-of-war bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-foreground/5">
        {/* FOR bar (purple gradient, from left) */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-full transition-all duration-500 ease-out"
          style={{
            width: `${forPercent}%`,
            background:
              "linear-gradient(90deg, #7b3fe4 0%, #a855f7 100%)",
            boxShadow: "0 0 8px rgba(123, 63, 228, 0.3)",
          }}
        />

        {/* AGAINST bar (muted, from right) */}
        <div
          className="absolute inset-y-0 right-0 rounded-r-full transition-all duration-500 ease-out"
          style={{
            width: `${againstPercent}%`,
            background:
              "linear-gradient(90deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)",
          }}
        />

        {/* Dynamic midpoint glow */}
        <div
          className="absolute inset-y-0 z-10 w-0.5 transition-all duration-500 ease-out"
          style={{
            left: `${forPercent}%`,
            transform: "translateX(-50%)",
            background: "rgba(255, 255, 255, 0.8)",
            boxShadow: "0 0 6px rgba(255, 255, 255, 0.4)",
          }}
        />
      </div>
    </div>
  );
}
