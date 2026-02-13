import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
  return (
    <section className="hidden gap-x-4 gap-y-8 py-8 mb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="h-[48px] w-20 rounded lg:h-[56px] lg:w-24" />
          <Skeleton className="h-4 w-32 rounded sm:h-5" />
        </div>
      ))}
    </section>
  );
}
