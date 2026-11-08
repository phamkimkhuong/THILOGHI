"use client";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
    <div><h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
    <div className="flex flex-wrap items-center gap-2">{actions}</div>
  </div>;
}
export function RefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return <button type="button" onClick={onClick} disabled={loading} className="erp-button border border-border bg-surface hover:bg-surface-hover text-foreground shadow-xs">
    <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Làm mới
  </button>;
}
// Cache bộ nhớ tạm Client-side để hỗ trợ Stale-While-Revalidate khi chuyển tab
const clientMemoryCache = new Set<string>();

export function clearClientListCache(key?: string) {
  if (key) clientMemoryCache.delete(key);
  else clientMemoryCache.clear();
}

// A failed request must not look like an empty result.
export function useListFeedback(cacheKey?: string) {
  const [loading, setLoading] = useState(() => (cacheKey ? !clientMemoryCache.has(cacheKey) : true));
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  const runLoad = useCallback(async (work: (isCurrent: () => boolean) => Promise<void>, forceSpinner = false) => {
    const id = ++request.current;
    if (forceSpinner || (cacheKey ? !clientMemoryCache.has(cacheKey) : true)) {
      setLoading(true);
    }
    setError(null);
    try {
      await work(() => id === request.current);
      if (cacheKey) clientMemoryCache.add(cacheKey);
    }
    catch { if (id === request.current) setError("Không tải được dữ liệu. Vui lòng thử lại."); }
    finally { if (id === request.current) setLoading(false); }
  }, [cacheKey]);

  return { loading, error, runLoad };
}
export function TableFeedback({ columns, loading, error, onRetry }: { columns: number; loading: boolean; error: string | null; onRetry: () => void }) {
  if (!loading && !error) return null;
  return <tr><td colSpan={columns} className="py-12 text-center">
    {loading ? <div role="status" className="flex items-center justify-center gap-2 text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />Đang tải dữ liệu…</div>
      : <div role="alert" className="flex flex-col items-center gap-3 text-foreground"><AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />{error}<button type="button" onClick={onRetry} className="erp-button border border-border bg-surface hover:bg-surface-hover text-foreground">Thử lại</button></div>}
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
export function Pagination({ pagination: p, loading, error, loaded, limit, sizeOptions = [25, 50, 100, 200] }: { pagination: ReturnType<typeof usePagination>; loading?: boolean; error?: boolean; loaded: number; limit: number; sizeOptions?: number[] }) {
  return <div className="space-y-2 border-t border-border px-3 py-3 text-xs text-muted-foreground">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span aria-live="polite">{error ? "Không tải được dữ liệu" : loading ? "Đang tải…" : `${p.total ? p.start + 1 : 0}–${p.end} / ${p.total} kết quả trong ${loaded} bản ghi đã tải`}</span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">Số dòng<select value={p.size} disabled={loading || error} onChange={e => p.setSize(Number(e.target.value))} className="rounded border border-border bg-surface text-foreground px-2 py-1">{sizeOptions.map(size => <option key={size} value={size}>{size >= 200 ? `${size} (Tất cả)` : size}</option>)}</select></label>
        <nav aria-label="Phân trang" className="flex items-center gap-2">
          <button type="button" aria-label="Trang trước" disabled={loading || error || p.page <= 1} onClick={() => p.setPage(p.page - 1)} className="erp-button border border-border bg-surface hover:bg-surface-hover text-foreground"><ChevronLeft className="h-4 w-4" /></button>
          <span>Trang {p.page} / {p.pageCount}</span>
          <button type="button" aria-label="Trang sau" disabled={loading || error || p.page >= p.pageCount} onClick={() => p.setPage(p.page + 1)} className="erp-button border border-border bg-surface hover:bg-surface-hover text-foreground"><ChevronRight className="h-4 w-4" /></button>
        </nav>
      </div>
    </div>
    {!loading && !error && loaded >= limit && <p className="text-amber-600 font-medium">Đã tải tối đa {limit} bản ghi. Kết quả lọc chỉ áp dụng trên dữ liệu đã tải.</p>}
  </div>;
}

/**
 * ====================================================================
 * RESPONSIVE UI PRIMITIVES DÙNG CHUNG CHO TOÀN BỘ PHÂN HỆ LIST PAGES
 * ====================================================================
 */

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className = "",
  disabled = false,
}: SearchInputProps) {
  return (
    <div className={`relative flex-1 flex items-center ${className}`}>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full !pl-10 !pr-9 py-2 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-surface-hover transition-colors cursor-pointer"
          title="Xóa từ khóa tìm kiếm"
          aria-label="Xóa từ khóa tìm kiếm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function TableContainer({
  children,
  className = "",
  ariaLabel = "Bảng dữ liệu",
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface overflow-hidden shadow-xs ${className}`}>
      <div className="overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );
}

export function FilterBarContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-3 rounded-xl bg-surface border border-border space-y-3 shadow-xs ${className}`}>
      {children}
    </div>
  );
}

/**
 * Bí danh (Alias) cho FilterBarContainer
 */
export const FilterToolbar = FilterBarContainer;

export function ChipScrollRow({
  label,
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 min-w-0 max-w-full ${className}`}>
      <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0 text-xs">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}:
      </span>
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 py-0.5">
        {children}
      </div>
    </div>
  );
}

export { FormGrid } from "@/components/ui/form";
