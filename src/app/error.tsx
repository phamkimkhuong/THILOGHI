"use client";

import Link from "next/link";

export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
    <h1 className="text-xl font-semibold text-foreground">Không tải được trang</h1>
    <p role="alert" className="text-sm text-muted-foreground">Đã xảy ra lỗi. Bạn có thể thử lại hoặc đăng nhập lại.</p>
    <div className="flex gap-3">
      <button type="button" onClick={retry} className="erp-button bg-primary text-white hover:bg-primary-hover">Thử lại</button>
      <Link href="/login" className="erp-button border border-border bg-surface text-foreground hover:bg-surface-hover">Đăng nhập</Link>
    </div>
  </main>;
}
