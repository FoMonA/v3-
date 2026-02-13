import { ProposalState, PROPOSAL_STATE_LABELS } from "@/lib/types";
import type { ProposalState as ProposalStateType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  state: ProposalStateType;
  className?: string;
}

const STATE_TO_CLASS: Record<ProposalStateType, string> = {
  [ProposalState.Pending]: "badge-pending",
  [ProposalState.Active]: "badge-active",
  [ProposalState.Canceled]: "badge-failed",
  [ProposalState.Defeated]: "badge-failed",
  [ProposalState.Succeeded]: "badge-success",
  [ProposalState.Queued]: "badge-glass",
  [ProposalState.Expired]: "badge-failed",
  [ProposalState.Executed]: "badge-success",
};

export function StatusBadge({ state, className }: StatusBadgeProps) {
  return (
    <span className={cn(STATE_TO_CLASS[state], className)}>
      {PROPOSAL_STATE_LABELS[state]}
    </span>
  );
}
