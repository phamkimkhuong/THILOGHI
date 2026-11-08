import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in-50 duration-200">
      {/* 1. Header Bar: Tiêu đề, Mã báo giá & Nút thao tác */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48 sm:w-64" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-40 sm:w-56" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* 2. Thông tin chung hồ sơ (Khách hàng, Phân vùng, Hàng hóa, Thanh toán) */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-5 w-44" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bố cục Master-Detail 2 cột chuẩn SalesFlow */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        {/* CỘT TRÁI (65%): Tuyến dịch vụ & Tra cứu giá mua NCC */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>

          {/* Dòng dịch vụ 1 */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>

            {/* Khung tra cứu giá mua */}
            <div className="rounded-xl border border-border/80 bg-[#f8fafc] dark:bg-surface-hover/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>

          {/* Dòng dịch vụ 2 */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-3 opacity-70">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Skeleton className="h-9 rounded-lg" />
              <Skeleton className="h-9 rounded-lg" />
              <Skeleton className="h-9 rounded-lg" />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (35%): Panel Tổng hợp tài chính P&L & Margin */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-5 w-36" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>

          {/* Các dòng tài chính */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24 font-mono" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24 font-mono" />
            </div>
            <div className="border-t border-dashed border-border pt-2 flex items-center justify-between">
              <Skeleton className="h-4 w-24 font-semibold" />
              <Skeleton className="h-5 w-28 font-mono font-bold" />
            </div>
            <div className="rounded-xl border border-border/80 bg-[#f8fafc] dark:bg-surface-hover/30 p-3 flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>

          {/* Nút hành động chính */}
          <div className="pt-2 space-y-2">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

