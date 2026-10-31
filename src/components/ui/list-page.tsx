"use client";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
    <div><h1 className="text-2xl font-semibold text-white">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}</div>
    <div className="flex flex-wrap items-center gap-2">{actions}</div>
  </div>;
}
export function RefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return <button type="button" onClick={onClick} disabled={loading} className="erp-button border border-slate-700 bg-slate-900 hover:bg-slate-800">
    <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới
  </button>;
}
// A failed request must not look like an empty result.
export function useListFeedback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const runLoad = useCallback(async (work: (isCurrent: () => boolean) => Promise<void>) => {
    const id = ++request.current;
    setLoading(true); setError(null);
    try { await work(() => id === request.current); }
    catch { if (id === request.current) setError("Không tải được dữ liệu. Vui lòng thử lại."); }
    finally { if (id === request.current) setLoading(false); }
  }, []);
  return { loading, error, runLoad };
}
export function TableFeedback({ columns, loading, error, onRetry }: { columns: number; loading: boolean; error: string | null; onRetry: () => void }) {
  return <tr><td colSpan={columns} className="py-12 text-center">
    {loading ? <div role="status" className="flex items-center justify-center gap-2 text-slate-400"><RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />Đang tải dữ liệu…</div>
      : <div role="alert" className="flex flex-col items-center gap-3 text-slate-300"><AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />{error}<button type="button" onClick={onRetry} className="erp-button border border-slate-700 hover:bg-slate-800">Thử lại</button></div>}
  </td></tr>;
}
export function usePagination(total: number, filterKey: string) {
  const [size, setSize] = useState(25);
  const [position, setPosition] = useState({ key: filterKey, page: 1 });
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = position.key === filterKey ? Math.min(position.page, pageCount) : 1;
  if (position.key !== filterKey || position.page !== page) {
    setPosition({ key: filterKey, page });
  }
  return {
    total, size, page, pageCount, start: (page - 1) * size, end: Math.min(page * size, total),
    setPage: (next: number) => setPosition({ key: filterKey, page: Math.max(1, Math.min(next, pageCount)) }),
    setSize: (next: number) => { setSize(next); setPosition({ key: filterKey, page: 1 }); },
  };
}
export function Pagination({ pagination: p, loading, error, loaded, limit }: { pagination: ReturnType<typeof usePagination>; loading?: boolean; error?: boolean; loaded: number; limit: number }) {
  return <div className="space-y-2 border-t border-slate-800 px-3 py-3 text-xs text-slate-400">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span aria-live="polite">{error ? "Không tải được dữ liệu" : loading ? "Đang tải…" : `${p.total ? p.start + 1 : 0}–${p.end} / ${p.total} kết quả trong ${loaded} bản ghi đã tải`}</span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">Số dòng<select value={p.size} disabled={loading || error} onChange={e => p.setSize(Number(e.target.value))} className="rounded border border-slate-700 bg-slate-950 px-2 py-1">{[25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
        <nav aria-label="Phân trang" className="flex items-center gap-2">
          <button type="button" aria-label="Trang trước" disabled={loading || error || p.page <= 1} onClick={() => p.setPage(p.page - 1)} className="erp-button border border-slate-700"><ChevronLeft className="h-4 w-4" /></button>
          <span>Trang {p.page} / {p.pageCount}</span>
          <button type="button" aria-label="Trang sau" disabled={loading || error || p.page >= p.pageCount} onClick={() => p.setPage(p.page + 1)} className="erp-button border border-slate-700"><ChevronRight className="h-4 w-4" /></button>
        </nav>
      </div>
    </div>
    {!loading && !error && loaded >= limit && <p className="text-amber-300">Đã tải tối đa {limit} bản ghi. Kết quả lọc chỉ áp dụng trên dữ liệu đã tải.</p>}
  </div>;
}
