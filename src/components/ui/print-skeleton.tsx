import { Skeleton } from "@/components/ui/skeleton";

export function PrintSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* 1. Thanh tác vụ phía trên */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* 2. Khung giấy A4 Trắng chuẩn hóa nhận diện thương hiệu */}
      <article className="rounded-xl border border-border bg-white p-6 sm:p-10 space-y-6 shadow-xs max-w-5xl mx-auto">
        {/* Header phiếu in */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-200" />
              <Skeleton className="h-7 w-64 bg-slate-200" />
            </div>
            <Skeleton className="h-4 w-44 bg-slate-200" />
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-4 w-32 bg-slate-200 ml-auto" />
            <Skeleton className="h-3.5 w-24 bg-slate-200 ml-auto" />
          </div>
        </div>

        {/* Thông tin khách hàng & hồ sơ */}
        <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <Skeleton className="h-5 w-60 bg-slate-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <Skeleton className="h-4 w-48 bg-slate-200" />
            <Skeleton className="h-4 w-40 bg-slate-200" />
            <Skeleton className="h-4 w-64 bg-slate-200" />
            <Skeleton className="h-4 w-36 bg-slate-200" />
          </div>
        </div>

        {/* Bảng cước dịch vụ in ấn */}
        <div className="rounded-xl border border-slate-300 overflow-hidden">
          <div className="bg-slate-100 p-3 flex items-center justify-between border-b border-slate-300">
            <Skeleton className="h-4 w-28 bg-slate-300" />
            <Skeleton className="h-4 w-24 bg-slate-300" />
          </div>
          <div className="divide-y divide-slate-200">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-4 w-6 bg-slate-200 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-48 bg-slate-200" />
                    <Skeleton className="h-3 w-32 bg-slate-200" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 bg-slate-200" />
                <Skeleton className="h-4 w-16 bg-slate-200" />
                <Skeleton className="h-4 w-24 bg-slate-200 font-mono" />
                <Skeleton className="h-4 w-28 bg-slate-200 font-mono font-bold" />
              </div>
            ))}
          </div>
          {/* Tổng tiền */}
          <div className="bg-slate-50 p-4 border-t border-slate-300 flex items-center justify-between">
            <Skeleton className="h-5 w-52 bg-slate-300" />
            <Skeleton className="h-6 w-36 bg-slate-300 font-mono" />
          </div>
        </div>

        {/* Chữ ký xác nhận */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200">
          <div className="text-center space-y-2">
            <Skeleton className="h-4 w-32 bg-slate-200 mx-auto" />
            <Skeleton className="h-3 w-24 bg-slate-200 mx-auto" />
            <div className="h-16" />
            <Skeleton className="h-4 w-36 bg-slate-200 mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-4 w-36 bg-slate-200 mx-auto" />
            <Skeleton className="h-3 w-28 bg-slate-200 mx-auto" />
            <div className="h-16" />
            <Skeleton className="h-4 w-40 bg-slate-200 mx-auto" />
          </div>
        </div>
      </article>
    </div>
  );
}

