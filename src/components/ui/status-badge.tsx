const states: Record<string, { label: string; tone: string }> = {
  NONE: { label: "Chưa kích hoạt", tone: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  ACTIVE: { label: "Hoạt động", tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 font-semibold" },
  AVAILABLE: { label: "Sẵn sàng", tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 font-semibold" },
  APPROVED: { label: "Đã duyệt", tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 font-semibold" },
  PENDING: { label: "Chờ kích hoạt", tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 font-semibold" },
  PENDING_APPROVAL: { label: "Chờ duyệt", tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 font-semibold" },
  MAINTENANCE: { label: "Bảo dưỡng", tone: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 font-semibold" },
  SUSPENDED: { label: "Tạm ngưng", tone: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 font-semibold" },
  REJECTED: { label: "Từ chối", tone: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 font-semibold" },
  DRAFT: { label: "Bản nháp", tone: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  INACTIVE: { label: "Ngừng hoạt động", tone: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" },
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const state = states[status || ""] || { label: status || "Chưa có trạng thái", tone: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" };
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${state.tone}`}>{state.label}</span>;
}
