import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFoma, calculateOdds, parseFomaInput } from "@/lib/format";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { usePlaceBet } from "@/hooks/use-place-bet";
import { useUserBet } from "@/hooks/use-user-bet";
import { useResolve } from "@/hooks/use-resolve";
import { showToast } from "@/lib/toast";
import { ProposalState } from "@/lib/types";
import type { Market, ProposalState as ProposalStateType } from "@/lib/types";

interface BettingSectionProps {
  proposalId: bigint;
  market: Market;
  proposalState: ProposalStateType;
  onMarketChange?: () => Promise<unknown>;
  className?: string;
}

export function BettingSection({
  proposalId,
  market,
  proposalState,
  onMarketChange,
  className,
}: BettingSectionProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const { placeBet, status: betStatus } = usePlaceBet(proposalId);
  const { data: userBet, refetch: refetchUserBet } = useUserBet(proposalId, address);

  const { resolve, status: resolveStatus } = useResolve(proposalId);


  const totalPool = market.totalYes + market.totalNo;
  const hasPool = totalPool > 0n;
  const { yesPercent, noPercent } = calculateOdds(
    market.totalYes,
    market.totalNo,
  );

  const isBettingOpen =
    proposalState === ProposalState.Active ||
    proposalState === ProposalState.Pending;

  const isResolved = market.resolved;
  const isExecuted = proposalState === ProposalState.Executed;
  const isEnded =
    proposalState === ProposalState.Defeated ||
    proposalState === ProposalState.Succeeded ||
    isExecuted ||
    proposalState === ProposalState.Expired;

  // Derive outcome: market.resolved is authoritative; otherwise infer from proposal state
  const outcomeIsYes = isResolved
    ? market.outcome
    : proposalState === ProposalState.Succeeded ||
      proposalState === ProposalState.Executed;


  const isBetDisabled =
    !amount || betStatus === "approving" || betStatus === "betting";

  const handleBet = async (yesOrNo: boolean) => {
    if (!address) {
      showToast("error", "Wallet Required", "Connect your wallet to place a bet");
      return;
    }
    const parsedAmount = parseFomaInput(amount);
    if (parsedAmount === 0n) return;
    await placeBet(yesOrNo, parsedAmount);
    await Promise.all([refetchUserBet(), onMarketChange?.()]);
    setAmount("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Odds progress bar */}
      {hasPool ? (
        <div className="space-y-1.5">
          {/* Labels row */}
          <div className="flex items-center justify-between">
            <span className="shrink-0 font-mono text-xs font-bold text-primary">
              YES {yesPercent.toFixed(1)}%
              <span className="ml-1 hidden text-[10px] font-normal text-primary/70 sm:inline">
                ({formatFoma(market.totalYes)})
              </span>
            </span>
            <span className="truncate px-2 font-mono text-[10px] font-bold text-foreground/50">
              {formatFoma(totalPool)} Pool
            </span>
            <span className="shrink-0 font-mono text-xs font-medium text-foreground/60">
              <span className="mr-1 hidden text-[10px] font-normal text-foreground/40 sm:inline">
                ({formatFoma(market.totalNo)})
              </span>
              {noPercent.toFixed(1)}% NO
            </span>
          </div>

          {/* Visual odds bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-foreground/5">
            {/* YES bar (from left, orange-to-purple) */}
            <div
              className="absolute inset-y-0 left-0 rounded-l-full transition-all duration-500 ease-out"
              style={{
                width: `${yesPercent}%`,
                background:
                  "linear-gradient(90deg, #ff8c32 0%, #a855f7 100%)",
                boxShadow: "0 0 8px rgba(255, 140, 50, 0.3)",
              }}
            />

            {/* NO bar (from right, muted) */}
            <div
              className="absolute inset-y-0 right-0 rounded-r-full transition-all duration-500 ease-out"
              style={{
                width: `${noPercent}%`,
                background:
                  "linear-gradient(90deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)",
              }}
            />

            {/* Dynamic midpoint glow */}
            <div
              className="absolute inset-y-0 z-10 w-0.5 transition-all duration-500 ease-out"
              style={{
                left: `${yesPercent}%`,
                transform: "translateX(-50%)",
                background: "rgba(255, 255, 255, 0.8)",
                boxShadow: "0 0 6px rgba(255, 255, 255, 0.4)",
              }}
            />
          </div>
        </div>
      ) : (
        <div className="text-center font-mono text-xs text-foreground/50">
          {isBettingOpen ? "No bets yet -- be the first" : "No bets placed"}
        </div>
      )}

      {/* Outcome badge -- show for any ended proposal */}
      {isEnded && hasPool && (
        <div
          className={cn(
            "rounded-lg border p-2.5 text-center font-mono text-sm font-bold",
            outcomeIsYes
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-foreground/20 bg-foreground/5 text-foreground/60",
          )}
        >
          {outcomeIsYes ? (<>Proposal Passed -- YES Won <span className="text-xl">{"\ud83c\udf89"}</span></>) : (<>Proposal Failed -- NO Won <span className="text-xl">{"\ud83c\udf89"}</span></>)}
        </div>
      )}

      {/* Resolve button -- when proposal ended, market has bets, but not yet resolved */}
      {isExecuted && hasPool && !isResolved && (
        <Button
          size="sm"
          disabled={resolveStatus === "resolving"}
          onClick={async () => {
            await resolve();
            await Promise.all([onMarketChange?.(), refetchUserBet()]);
          }}
          className="w-full cursor-pointer font-mono text-xs font-bold text-white"
          style={{
            background: "linear-gradient(90deg, #ff8c32 0%, #a855f7 100%)",
          }}
        >
          {resolveStatus === "resolving" ? "Resolving..." : "Resolve Market"}
        </Button>
      )}

      {/* User position */}
      {userBet?.hasBet && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">
            Your Position
          </span>
          <div className="mt-1 font-mono text-sm font-medium text-foreground">
            {formatFoma(
              userBet.side === "yes" ? userBet.yesBet : userBet.noBet,
            )}{" "}
            FOMA on{" "}
            <span
              className={
                userBet.side === "yes" ? "text-primary" : "text-foreground/60"
              }
            >
              {userBet.side === "yes" ? "YES" : "NO"}
            </span>
          </div>
        </div>
      )}

      {/* Bet input + buttons (only when betting is open and user hasn't bet) */}
      {isBettingOpen && !userBet?.hasBet && (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-foreground/3 px-3 py-2">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Amount (min 1 FOMA)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent font-mono text-base sm:text-sm text-foreground outline-none placeholder:text-foreground/25"
            />
            <span className="shrink-0 font-mono text-xs text-foreground/40">
              FOMA
            </span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={!!address && isBetDisabled}
              onClick={() => handleBet(true)}
              className={cn(
                "group flex size-14 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_4px_20px_rgba(255,140,50,0.3)] transition-all hover:scale-110 hover:shadow-[0_4px_28px_rgba(255,140,50,0.5)] disabled:cursor-not-allowed disabled:opacity-40",
                !address && "cursor-pointer opacity-40",
              )}
              style={{
                background: "linear-gradient(135deg, #ff8c32 0%, #a855f7 100%)",
              }}
            >
              <ThumbsUp className="size-6" />
            </button>
            <span className="font-mono text-[10px] font-bold uppercase text-foreground/20">
              {betStatus === "approving"
                ? "Approving..."
                : betStatus === "betting"
                  ? "Betting..."
                  : "Place Bet"}
            </span>
            <button
              type="button"
              disabled={!!address && isBetDisabled}
              onClick={() => handleBet(false)}
              className={cn(
                "group flex size-14 cursor-pointer items-center justify-center rounded-full border border-foreground/20 bg-foreground/5 text-foreground/50 transition-all hover:scale-110 hover:border-foreground/40 hover:text-foreground/70 disabled:cursor-not-allowed disabled:opacity-40",
                !address && "cursor-pointer opacity-40",
              )}
            >
              <ThumbsDown className="size-6" />
            </button>
          </div>
        </>
      )}

    </div>
  );
}
