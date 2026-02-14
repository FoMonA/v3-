import { StatusBadge } from "./status-badge";
import { VoteProgress } from "./vote-progress";
import { BettingSection } from "./betting-section";
import { truncateAddress, cn } from "@/lib/utils";
import { formatFoma, formatCountdown } from "@/lib/format";
import { CONTRACTS } from "@/lib/contracts";
import { ACTIVE_CHAIN } from "@/lib/constants";
import { ProposalState } from "@/lib/types";
import type { Proposal } from "@/lib/types";
import { Bot, Coins, Dices, Timer, ExternalLink } from "lucide-react";

interface ProposalCardProps {
  proposal: Proposal;
  currentBlock?: bigint;
  onMarketChange?: () => Promise<unknown>;
  className?: string;
}

export function ProposalCard({
  proposal,
  currentBlock,
  onMarketChange,
  className,
}: ProposalCardProps) {

  const isActive = proposal.state === ProposalState.Active;
  const isPending = proposal.state === ProposalState.Pending;
  const isLive = isActive || isPending;
  const isEnded =
    proposal.state === ProposalState.Defeated ||
    proposal.state === ProposalState.Succeeded ||
    proposal.state === ProposalState.Executed ||
    proposal.state === ProposalState.Expired;

  const countdown =
    currentBlock != null ? formatCountdown(currentBlock, proposal.deadline) : "...";

  const rewardPool = proposal.cost + proposal.votingFees;

  return (
    <div
      className={cn(
        "glass-card space-y-6 p-7 transition-opacity",
        isEnded && "opacity-70",
        className,
      )}
    >
      {/* Header: category + status + cost */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="badge-glass">{proposal.categoryName}</span>
          <StatusBadge state={proposal.state} />
        </div>
        <div className="flex items-center gap-1.5 text-foreground/60">
          <Coins className="size-3.5" />
          <span className="font-mono text-sm">
            Cost: {formatFoma(proposal.cost, 0)} FOMA
          </span>
        </div>
      </div>

      {/* Title + description */}
      <div className="space-y-1.5">
        <h3 className="font-mono text-lg font-bold leading-tight text-foreground">
          {proposal.title}
        </h3>
        <p className="text-sm leading-relaxed text-foreground/50">
          {proposal.description}
        </p>
      </div>

      {/* Meta row: proposer + countdown + reward */}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`${ACTIVE_CHAIN.explorer}/address/${proposal.proposer}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-foreground/50 transition-colors hover:text-foreground/80"
        >
          <Bot className="size-3" />
          <span className="font-mono text-[10px]">
            {truncateAddress(proposal.proposer)}
          </span>
          <ExternalLink className="size-2.5" />
        </a>
        {isActive && (
          <div className="flex items-center gap-1 text-primary/60">
            <Timer className="size-3" />
            <span className="font-mono text-[10px]">{countdown}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1 text-primary/80">
          <span className="font-mono text-sm">
            Proposer Reward: {formatFoma(rewardPool, 0)} FOMA
          </span>
        </div>
      </div>

      {/* ── Dual Voting Section ── */}
      <div className="space-y-5">
        {/* Agent Vote */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-foreground/60" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
              Agent Vote
            </span>
            <a
              href={`${ACTIVE_CHAIN.explorer}/address/${CONTRACTS.GOVERNOR}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-foreground/30 transition-colors hover:text-foreground/60"
            >
              <span className="font-mono text-[9px]">Governor</span>
              <ExternalLink className="size-2.5" />
            </a>
            {isLive && (
              <span className="ml-auto flex items-center gap-1.5">
                <span className="relative flex size-1.5">
                  <span className="absolute -inset-[0.1rem] inline-flex animate-ping rounded-full bg-chart-4 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-chart-4" />
                </span>
                <span className="font-mono text-[9px] uppercase text-chart-4/60">
                  Live
                </span>
              </span>
            )}
          </div>
          <VoteProgress
            forVotes={proposal.forVotes}
            againstVotes={proposal.againstVotes}
          />
        </div>

        {/* VS Divider */}
        <div className="mt-10 mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-foreground/5" />
          <span className="rounded-full border border-foreground/10 bg-foreground/3 px-2.5 py-0.5 font-mono text-[9px] font-bold text-foreground/20">
            VS
          </span>
          <div className="h-px flex-1 bg-foreground/5" />
        </div>

        {/* Human Bet */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Dices className="size-5 text-primary/60" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary/60">
              Human Bet
            </span>
            <a
              href={`${ACTIVE_CHAIN.explorer}/address/${CONTRACTS.POOL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-foreground/30 transition-colors hover:text-foreground/60"
            >
              <span className="font-mono text-[9px]">Pool</span>
              <ExternalLink className="size-2.5" />
            </a>
            {isLive && (
              <span className="ml-auto flex items-center gap-1.5">
                <span className="relative flex size-1.5">
                  <span className="absolute -inset-[0.1rem] inline-flex animate-ping rounded-full bg-chart-4 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-chart-4" />
                </span>
                <span className="font-mono text-[9px] uppercase text-chart-4/60">
                  Live
                </span>
              </span>
            )}
          </div>
          <BettingSection
            proposalId={proposal.id}
            market={proposal.market}
            proposalState={proposal.state}
            onMarketChange={onMarketChange}
          />
        </div>
      </div>
    </div>
  );
}
