import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClaim } from "@/hooks/use-claim";
import { formatFoma } from "@/lib/format";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { fetchClaimableRewards } from "@/lib/api";

interface ClaimableReward {
  proposalId: bigint;
  proposalTitle: string;
  amount: bigint;
}

const PAGE_SIZE = 5;

function ClaimRow({ reward }: { reward: ClaimableReward }) {
  const { claim, status } = useClaim(reward.proposalId);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/4 p-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Trophy className="size-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm font-bold text-primary">
          You won {formatFoma(reward.amount)} FOMA!
        </div>
        <div className="line-clamp-1 font-mono text-[11px] leading-relaxed text-foreground/40">
          {reward.proposalTitle}
        </div>
      </div>
      <Button
        variant="glass"
        size="sm"
        disabled={status === "claiming"}
        onClick={claim}
        className="shrink-0 cursor-pointer border-primary/30 font-mono text-xs font-bold text-primary hover:border-primary/50 hover:bg-primary/10"
      >
        {status === "claiming" ? "..." : "Claim"}
      </Button>
    </div>
  );
}

export function ClaimRewards() {
  const { address } = useAccount();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data: apiRewards } = useQuery({
    queryKey: ["claimable-rewards", address],
    queryFn: () => fetchClaimableRewards(address!),
    enabled: !!address,
    refetchInterval: 15_000,
  });

  const rewards = useMemo(() => {
    if (!apiRewards) return [];
    const result: ClaimableReward[] = [];
    for (const reward of apiRewards) {
      const amount = BigInt(reward.amount);
      if (amount > 0n) {
        result.push({
          proposalId: BigInt(reward.proposalId),
          proposalTitle: reward.title,
          amount,
        });
      }
    }
    return result;
  }, [apiRewards]);

  if (!address) return null;

  const shown = rewards.slice(0, visible);
  const canShowLess = visible > PAGE_SIZE;

  return (
    <div className="space-y-4">
      <span className="mb-6 block font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
        Claimable Rewards ({rewards.length})
      </span>
      {rewards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-foreground/10 py-6 text-center font-mono text-[11px] text-foreground/20">
          No claimable rewards yet
        </div>
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {shown.map((reward, i) => (
                <motion.div
                  key={reward.proposalId.toString()}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <ClaimRow reward={reward} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
          {rewards.length > PAGE_SIZE && (
            <button
              type="button"
              onClick={() => setVisible(canShowLess ? PAGE_SIZE : rewards.length)}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-foreground/10 bg-foreground/3 py-2 font-mono text-[11px] text-foreground/40 transition-colors hover:text-foreground/60"
            >
              {canShowLess ? "Show less" : `Show all (${rewards.length})`}
              <ChevronDown className={canShowLess ? "size-3.5 rotate-180" : "size-3.5"} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
