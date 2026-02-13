import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/utils";
import { Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/lib/api";
import { AgentTickerSkeleton } from "@/components/skeletons/agent-ticker-skeleton";

interface AgentTickerProps {
  className?: string;
}

export function AgentTicker({ className }: AgentTickerProps) {
  const { data: agentAddresses, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    refetchInterval: 30_000,
  });

  // Duplicate the list so when the first set scrolls out of view,
  // the second set is already in position - creating a seamless loop.
  const agents = useMemo(
    () => [...(agentAddresses ?? []), ...(agentAddresses ?? [])],
    [agentAddresses],
  );

  if (isLoading || agents.length === 0) return <AgentTickerSkeleton />;

  return (
    <div
      className={cn(
        "relative hidden overflow-hidden border-y border-foreground/5 py-3 sm:block",
        className,
      )}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      {/* Scrolling track - w-max ensures items stay in a single row */}
      <div
        className="flex w-max gap-3"
        style={{ animation: "ticker-scroll 40s linear infinite" }}
      >
        {agents.map((addr, i) => (
          <div
            key={`${addr}-${i}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent/15 bg-foreground/3 px-3 py-1"
          >
            <Bot className="size-3 text-accent/60" />
            <span className="font-mono text-[11px] text-foreground/50">
              Agent-{truncateAddress(addr)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
