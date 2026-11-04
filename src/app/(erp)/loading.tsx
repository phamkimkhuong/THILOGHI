import { Skeleton } from "@/components/ui/skeleton";

export default function ErpLoading() {
  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* Page Header Skeleton */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 sm:w-64" />
          <Skeleton className="h-4 w-72 sm:w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Filter & Search Toolbar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      {/* Table Card Skeleton */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-[#f7f9fc] dark:bg-surface-hover flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="divide-y divide-border/60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-4 w-20 shrink-0 font-mono" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4 max-w-xs" />
                  <Skeleton className="h-3 w-1/2 max-w-[180px]" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full shrink-0" />
              <Skeleton className="h-4 w-24 shrink-0 font-mono hidden md:block" />
              <Skeleton className="h-4 w-28 shrink-0 font-mono hidden lg:block" />
              <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </div>

        {/* Pagination Footer Skeleton */}
        <div className="p-3.5 border-t border-border flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

