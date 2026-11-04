"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { catalogs, type Catalog, type Field } from "@/features/master-data/maintenance-config";
import { historyMaintenanceAction, listMaintenanceAction, optionsMaintenanceAction, saveMaintenanceAction } from "@/features/master-data/maintenance-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { usePermission } from "@/components/auth/permission-guard";
import { EmptyState } from "@/components/ui/empty-state";

type Row = Record<string, unknown>;
const control = "w-full rounded border border-border bg-surface p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500";
function Lookup({ kind, label, id, value, onChange }: {kind: string; label: string; id: string; value: string; onChange: (v: string) => void}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<{id: string; name: string}[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      setLoading(true);
      void optionsMaintenanceAction(kind, query).then(result => {
        if (!current) return;
        setError(result.success ? "" : result.error);
        setOptions(result.success ? result.rows : []);
      }).catch(() => { if (current) setError("Không tải được danh mục. Thử tìm lại."); })
        .finally(() => { if (current) setLoading(false); });
    }, 250);
    return () => { current = false; clearTimeout(timer); };
  }, [kind, query]);
  return <div className="space-y-1">
    <input className={control} aria-label={`Tìm ${label.toLowerCase()}`} placeholder="Tìm theo mã hoặc tên…" value={query} onChange={e => setQuery(e.target.value)} />
    <select id={id} aria-label={label} required className={control} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Chọn…</option>
      {value && !options.some(o => o.id === value) && <option value={value}>{value}</option>}
      {options.map(o => <option key={o.id} value={o.id}>{o.name} ({o.id})</option>)}
    </select>
    <small>{loading ? "Đang tìm…" : "Tối đa 50 kết quả; nhập thêm để thu hẹp."}</small>
    {error && <p role="alert" className="text-red-600">{error}</p>}
  </div>;
}

export default function MaintenancePage() {
  const [kind, setKind] = useState<Catalog>("partners");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [more, setMore] = useState(false);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [partnerId, setPartnerId] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [history, setHistory] = useState<Row[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyGeneration = useRef(0);
  const generation = useRef(0);
  const c = catalogs[kind];
  const { isManager: manager } = usePermission({ role });
  const canWrite = manager || (kind === "rates" && role === "PRICING_SPECIALIST");
  const editable = canWrite && (kind !== "rates" || !selected || ["DRAFT", "REJECTED"].includes(String(selected.status)));
  const dirty = selected && (c.fields as Field[]).some(f => (fields[f.key] ?? "") !== (selected[f.key] == null ? "" : String(selected[f.key])));
  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true); setError("");
    try {
      const result = await listMaintenanceAction(kind, search, page);
      if (request !== generation.current) return;
      if (!result.success) throw new Error(result.error);
      setRows(result.rows); setMore(result.hasMore); setRole(result.role);
    } catch (e) { if (request === generation.current) { setRows([]); setError(e instanceof Error ? e.message : "Không tải được dữ liệu."); } }
    finally { if (request === generation.current) setLoading(false); }
  }, [kind, search, page]);
  useEffect(() => {
    const token = generation;
    const timer = setTimeout(() => void load(), 250);
    return () => { clearTimeout(timer); token.current++; };
  }, [load]);
  function edit(row: Row | null) {
    setSelected(row); setPartnerId(row ? String(row[c.id]) : "");
    setFields(Object.fromEntries((c.fields as Field[]).map(f => [f.key, row?.[f.key] == null ? "" : String(row[f.key])])));
    setComment(""); setFormError(""); setHistory([]); setHistoryError(""); setHistoryLoading(false); historyGeneration.current++;
    setOpen(true);
  }
  async function save(action: "SAVE" | "SUBMIT" | "APPROVE" | "REJECT" | "RETIRE") {
    if (busy) return;
    if (action === "SUBMIT" && dirty) { setFormError("Vui lòng lưu nháp các thay đổi trước khi gửi duyệt."); return; }
    setBusy(true); setFormError("");
    try {
      const result = await saveMaintenanceAction({ kind, action, id: selected ? String(selected[c.id]) : ["customers", "vendors"].includes(kind) ? partnerId : undefined, revision: selected ? String(selected.revision) : undefined, fields: action === "SAVE" ? fields : undefined, comment });
      if (!result.success) throw new Error(result.error);
      const msg = `Đã lưu thao tác cho ${result.id}.`;
      setOpen(false); setNotice(msg); toast.success(msg); await load();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Không lưu được. Vui lòng thử lại.";
      setFormError(errMsg);
      toast.error(errMsg);
    }
    finally { setBusy(false); }
  }
  async function showHistory() {
    if (!selected) return;
    const request = ++historyGeneration.current;
    setHistoryLoading(true); setHistoryError("");
    try {
      const result = await historyMaintenanceAction(kind, String(selected[c.id]));
      if (request !== historyGeneration.current) return;
      if (!result.success) throw new Error(result.error);
      setHistory(result.rows);
      if (!result.rows.length) setHistoryError("Chưa có lịch sử trong đợt 3; vai trò cũ xem tại trang Đối tác.");
    } catch (e) { if (request === historyGeneration.current) setHistoryError(e instanceof Error ? e.message : "Không tải được lịch sử."); }
    finally { if (request === historyGeneration.current) setHistoryLoading(false); }
  }
  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold text-foreground">Quản lý danh mục và giá mua</h1><p className="text-sm text-muted-foreground">Tạo, cập nhật dữ liệu và theo dõi lịch sử thay đổi.</p></div><Link href="/master/customers" className="erp-button">Tra cứu đối tác</Link></div>
    <div className="flex flex-wrap gap-2" aria-label="Danh mục">{(Object.keys(catalogs) as Catalog[]).map(k => <button key={k} aria-pressed={kind === k} className={`erp-button ${kind === k ? "bg-blue-600 text-white" : ""}`} onClick={() => { if (k === kind) return; setRows([]); setLoading(true); setKind(k); setSearch(""); setPage(1); setNotice(""); }}>{catalogs[k].title}</button>)}</div>
    <div className="flex flex-wrap gap-2"><input className={`${control} max-w-sm`} aria-label="Tìm bản ghi" placeholder="Tìm mã, tên, NCC hoặc tuyến…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /><button className="erp-button" onClick={() => void load()} disabled={loading}>Tải lại</button>{canWrite && <button className="erp-button bg-blue-600 text-white" onClick={() => edit(null)}>Thêm {c.title.toLowerCase()}</button>}</div>
    {notice && <p role="status" className="text-green-700">{notice}</p>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {loading ? <p role="status">Đang tải…</p> : !error && (
      !rows.length ? (
        <EmptyState
          title="Không có dữ liệu phù hợp"
          description="Không tìm thấy bản ghi nào khớp với điều kiện tìm kiếm hoặc danh mục hiện tại."
          className="my-6"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="erp-table w-full">
            <thead>
              <tr>
                <th>Mã</th>
                <th>{kind === "rates" ? "Tuyến / giá mua / hiệu lực" : "Tên / thông tin"}</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={String(row[c.id])}>
                  <td>{String(row[c.id])}</td>
                  <td>
                    {kind === "rates" ? (
                      <>
                        <div>{String(row.pickup_name ?? row.pickup_location_id)} → {String(row.delivery_name ?? row.delivery_location_id)}</div>
                        <div>{String(row.vendor_name ?? row.vendor_id)} · {String(row.equipment_type)} · {String(row.buy_rate)} {String(row.currency)}</div>
                        <small>{String(row.valid_from)} → trước {String(row.valid_to)}</small>
                      </>
                    ) : (
                      String(row.display_name ?? row[c.name] ?? "—")
                    )}
                  </td>
                  <td>
                    <StatusBadge status={String(row.role_status ?? row.status ?? (row.is_active ? "ACTIVE" : "INACTIVE"))} />
                  </td>
                  <td>
                    <button className="erp-button" onClick={() => edit(row)}>Mở chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    )}
    <div className="flex items-center gap-3"><button className="erp-button" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {page} · 25 bản ghi/trang</span><button className="erp-button" disabled={!more || loading} onClick={() => setPage(p => p + 1)}>Tiếp</button></div>
    <Dialog.Root open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-surface border border-border p-5 text-foreground shadow-2xl">
      <Dialog.Title className="text-xl font-semibold text-foreground">{selected ? "Chi tiết" : "Thêm mới"} · {c.title}</Dialog.Title><Dialog.Description className="mb-4 text-sm text-muted-foreground">{kind === "rates" ? "Lưu nháp trước khi gửi duyệt. Người duyệt phải khác người sửa giá gần nhất. Giá đã duyệt chỉ có thể ngừng sử dụng." : "Giữ đúng dữ liệu nguồn; để trống thông tin chưa biết. Mã định danh được giữ nguyên khi chỉnh sửa."}</Dialog.Description>
      <form onSubmit={e => { e.preventDefault(); void save("SAVE"); }} className="space-y-4"><fieldset disabled={busy || !editable} className="grid gap-4 sm:grid-cols-2">
        {!selected && ["customers", "vendors"].includes(kind) && <div className="sm:col-span-2"><p>Đối tác *</p><Lookup kind="partners" label="Đối tác" id="role-partner" value={partnerId} onChange={setPartnerId} /></div>}
        {(c.fields as Field[]).map(f => <div key={f.key}><label htmlFor={`field-${f.key}`} className="mb-1 block text-sm font-medium">{f.label}{f.required ? " *" : ""}</label>{f.lookup ? <Lookup kind={f.lookup} label={f.label} id={`field-${f.key}`} value={fields[f.key] ?? ""} onChange={v => setFields(prev => ({...prev, [f.key]: v}))} /> : f.options ? <select id={`field-${f.key}`} className={control} required={f.required} value={fields[f.key] ?? ""} onChange={e => setFields(prev => ({...prev, [f.key]: e.target.value}))}><option value="">Chọn…</option>{f.options.map(o => <option key={o}>{o}</option>)}</select> : <input id={`field-${f.key}`} className={control} required={f.required} maxLength={f.max ?? 4000} type={f.type ?? "text"} step={f.key === "payment_terms_days" ? "1" : "0.01"} min={f.type === "number" ? "0" : undefined} value={fields[f.key] ?? ""} onChange={e => setFields(prev => ({...prev, [f.key]: e.target.value}))} />}</div>)}
      </fieldset><label className="block">Lý do / ghi chú thay đổi<textarea className={control} disabled={busy} maxLength={2000} value={comment} onChange={e => setComment(e.target.value)} /></label>
      {formError && <p role="alert" className="whitespace-pre-wrap text-red-600">{formError}</p>}
      <div className="flex flex-wrap gap-2">{editable && <button className="erp-button bg-blue-600 text-white" disabled={busy} type="submit">{busy ? "Đang lưu…" : kind === "rates" ? "Lưu nháp" : "Lưu thay đổi"}</button>}
        {kind === "rates" && selected && <>{canWrite && ["DRAFT", "REJECTED"].includes(String(selected.status)) && <button type="button" disabled={busy} className="erp-button" onClick={() => void save("SUBMIT")}>Gửi bản đã lưu để duyệt</button>}{manager && selected.status === "PENDING_APPROVAL" && <><button type="button" disabled={busy} className="erp-button" onClick={() => void save("APPROVE")}>Duyệt</button><button type="button" disabled={busy} className="erp-button" onClick={() => void save("REJECT")}>Từ chối</button></>}{manager && selected.status === "APPROVED" && <button type="button" disabled={busy} className="erp-button" onClick={() => void save("RETIRE")}>Ngừng sử dụng</button>}</>}
        {selected && <button type="button" className="erp-button" disabled={busy || historyLoading} onClick={() => void showHistory()}>{historyLoading ? "Đang tải…" : "Lịch sử thay đổi"}</button>}<Dialog.Close className="erp-button" disabled={busy}>Đóng</Dialog.Close></div></form>
      {historyError && <p role="status" className="mt-4">{historyError}</p>}
      {history.map((h, i) => <details key={i} className="mt-3 rounded border p-3"><summary>{String(h.action)} · {String(h.actor_name)} · {new Date(String(h.created_at)).toLocaleString("vi-VN")} · {String(h.comment ?? "")}</summary><div className="overflow-auto"><table className="erp-table w-full"><thead><tr><th>Thông tin</th><th>Trước</th><th>Sau</th></tr></thead><tbody>{[...(c.fields as Field[]), ...(kind === "rates" ? [{key: "status", label: "Trạng thái"}, {key: "validity_range", label: "Khoảng hiệu lực [từ, đến)"}] : [])].filter(f => f.key !== "valid_from" && f.key !== "valid_to").map(f => <tr key={f.key}><td>{f.label}</td><td>{String((h.before_data as Row | null)?.[f.key] ?? "—")}</td><td>{String((h.after_data as Row | null)?.[f.key] ?? "—")}</td></tr>)}</tbody></table></div></details>)}
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
