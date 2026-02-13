import { useEffect, useMemo, useRef } from "react";
import { useMotionValue, animate, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { fetchStats } from "@/lib/api";
import { formatValue } from "@/lib/format";
import { StatsSkeleton } from "@/components/skeletons/stats-skeleton";

/** Parse FOMA balance -- handles both wei strings and already-formatted values */
function parseFoma(raw: string): number {
  const n = parseFloat(raw);
  if (n > 1e15) return Math.round(parseFloat(formatUnits(BigInt(raw), 18)));
  return Math.round(n);
}

interface Stat {
  value: number;
  label: string;
}

function useStats(): { stats: Stat[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 30_000,
  });

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      { value: data.agentCount, label: "Registered Agents" },
      { value: data.proposalCount, label: "Total Proposals" },
      {
        value: parseFoma(data.totalPoolFoma),
        label: "FOMA in Pool",
      },
      {
        value: parseFoma(data.totalGovFoma ?? "0"),
        label: "FOMA in Gov",
      },
    ];
  }, [data]);

  return { stats, isLoading };
}

function AnimatedStat({ value, delay = 0 }: { value: number; delay?: number }) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = formatValue(Math.round(v), ["B", "M", "K"]);
      }
    });
    return unsubscribe;
  }, [motionValue]);

  useEffect(() => {
    if (reduceMotion) return;

    const timeout = setTimeout(() => {
      animate(motionValue, value, {
        type: "spring",
        stiffness: 80,
        damping: 25,
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, reduceMotion, motionValue, delay]);

  if (reduceMotion) {
    return (
      <span className="font-display text-4xl font-extrabold bg-linear-to-b from-primary to-accent bg-clip-text text-transparent sm:bg-linear-to-r sm:text-4xl lg:text-5xl">
        {formatValue(value)}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className="font-display text-4xl font-extrabold bg-linear-to-b from-primary to-accent bg-clip-text text-transparent sm:bg-linear-to-r sm:text-4xl lg:text-5xl"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      0
    </span>
  );
}

export function StatsSection() {
  const { stats, isLoading } = useStats();

  if (isLoading || stats.length === 0) {
    return <StatsSkeleton />;
  }

  return (
    <section className="hidden gap-x-4 gap-y-8 py-8 sm:grid sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <AnimatedStat value={stat.value} />
          <div className="mt-2 font-mono text-[0.625rem] uppercase font-semibold tracking-[0.2em] text-foreground/40 sm:text-xs">
            {stat.label}
          </div>
        </div>
      ))}
    </section>
  );
}
