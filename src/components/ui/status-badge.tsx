const states: Record<string, { label: string; tone: string }> = {
  NONE: { label: "Chưa kích hoạt", tone: "border-slate-700 bg-slate-800 text-slate-300" },
  ACTIVE: { label: "Hoạt động", tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" },
  AVAILABLE: { label: "Sẵn sàng", tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" },
  APPROVED: { label: "Đã duyệt", tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" },
  PENDING: { label: "Chờ kích hoạt", tone: "border-amber-500/25 bg-amber-500/10 text-amber-300" },
  PENDING_APPROVAL: { label: "Chờ duyệt", tone: "border-amber-500/25 bg-amber-500/10 text-amber-300" },
  MAINTENANCE: { label: "Bảo dưỡng", tone: "border-amber-500/25 bg-amber-500/10 text-amber-300" },
  SUSPENDED: { label: "Tạm ngưng", tone: "border-rose-500/25 bg-rose-500/10 text-rose-300" },
  REJECTED: { label: "Từ chối", tone: "border-rose-500/25 bg-rose-500/10 text-rose-300" },
  DRAFT: { label: "Bản nháp", tone: "border-slate-700 bg-slate-800 text-slate-300" },
  INACTIVE: { label: "Ngừng hoạt động", tone: "border-slate-700 bg-slate-800 text-slate-300" },
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const state = states[status || ""] || { label: status || "Chưa có trạng thái", tone: "border-slate-700 bg-slate-800 text-slate-300" };
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${state.tone}`}>{state.label}</span>;
}
