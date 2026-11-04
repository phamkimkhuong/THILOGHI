import Link from "next/link";
import { Building2, Compass, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-8 sm:p-10 text-center shadow-[0_4px_24px_rgba(22,59,116,0.06)] space-y-6">
        {/* Brand Header */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-primary border border-blue-100 shadow-xs mb-2">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold border border-blue-200">
            <Building2 className="w-3.5 h-3.5" /> THILOGI LOGISTICS
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            404 • Không tìm thấy trang
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Đường dẫn hoặc tài nguyên bạn đang truy cập không tồn tại, đã bị đổi tên hoặc bạn không có quyền xem.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/quotations"
            className="w-full sm:w-auto erp-button bg-primary text-white hover:bg-primary-hover shadow-xs font-bold inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Về Danh sách Báo giá
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto erp-button border border-border bg-surface text-foreground hover:bg-surface-hover inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Màn hình Đăng nhập
          </Link>
        </div>

        <div className="border-t border-border pt-4 text-xs text-muted-foreground">
          Tập đoàn THILOGI • Trung tâm Logistics Quốc tế Chu Lai
        </div>
      </div>
    </main>
  );
}

