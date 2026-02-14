import { Skeleton } from "@/components/ui/skeleton";

export function AgentTickerSkeleton() {
  return (
    <div
      className="relative hidden overflow-hidden border-y border-foreground/5 py-3 sm:block"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div className="flex gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-40 shrink-0 rounded-full" />
        ))}
      </div>
    </div>
  );
}
