"use client";

import Link from "next/link";

export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
    <h1 className="text-xl font-semibold text-white">Không tải được trang</h1>
    <p role="alert" className="text-sm text-slate-400">Đã xảy ra lỗi. Bạn có thể thử lại hoặc đăng nhập lại.</p>
    <div className="flex gap-3">
      <button type="button" onClick={retry} className="erp-button bg-blue-600 text-white hover:bg-blue-500">Thử lại</button>
      <Link href="/login" className="erp-button border border-slate-700">Đăng nhập</Link>
    </div>
  </main>;
}
