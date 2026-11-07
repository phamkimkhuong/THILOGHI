"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePermission } from "@/components/auth/permission-guard";
import { CurrencyInput, QuantityInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form";
import { getQuotationMasterDataAction, getQuotationDetailAction, lookupRoadRatesAction, saveDraftQuotationAction, approveQuotationAction, rejectQuotationAction, returnQuotationToDraftAction } from "@/features/quotation/actions";
import { createQuotationVersionAction } from "@/features/quotation/phase4-actions";
import { restoreQuotationItems, type ServiceItemState } from "@/features/quotation/editor-state";
import { commercialFingerprint, emptyServiceItem, rateWarning } from "@/features/quotation/workspace-state";
import { evaluateApprovalAuthority, isQuotationAuthor } from "@/features/quotation/approval-policy";
import { calculateQuotationFinancials, getBusinessDate } from "@/shared/utils/pricing";
import { cn } from "@/shared/utils/cn";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { createQuotationSchema, type ServicePackage } from "@/shared/schemas/quotation.schema";
import type { QuotationDetailResponse } from "@/server/modules/quotation/quotation.service";
import type { MasterOption } from "@/server/modules/master-data/master-data.service";

const inputClass = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60";
const panel = "rounded-xl border border-border bg-surface p-4 space-y-4 shadow-xs";
const money = (n: number) => new Intl.NumberFormat("vi-VN", {maximumFractionDigits: 0}).format(n) + " ₫";
const blankHeader = { customerId: "", regionId: "", commodityId: "", paymentTermsDays: 30 };
type Master = Awaited<ReturnType<typeof getQuotationMasterDataAction>>;

interface FieldErrors {
  customerId?: string;
  regionId?: string;
  paymentTermsDays?: string;
  items?: Record<number, {
    originLocationId?: string;
    destinationLocationId?: string;
    equipmentType?: string;
    plannedQuantity?: string;
    unitSellPrice?: string;
  }>;
}

function Choice({
  label,
  value,
  options,
  onChange,
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  options: MasterOption[];
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = options.filter(o => `${o.name} ${o.code ?? ""} ${o.id}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const current = options.find(o => o.id === value);
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">
        <span className={error ? "text-red-600 dark:text-red-400 font-semibold" : ""}>{label}</span>
        <select
          aria-label={label}
          className={cn(inputClass, error && "border-red-500 focus:ring-red-500 ring-1 ring-red-500/20")}
          disabled={disabled}
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Chọn…</option>
          {value && !filtered.some(o => o.id === value) && (
            <option value={value}>{current?.name ?? `${value} (không có trong danh mục hoạt động)`}</option>
          )}
          {filtered.slice(0, 100).map(o => (
            <option key={o.id} value={o.id}>{o.name}{o.code ? ` · ${o.code}` : ""}</option>
          ))}
        </select>
      </label>
      {!disabled && options.length > 15 && (
        <input
          aria-label={`Tìm ${label.toLowerCase()}`}
          className={inputClass}
          placeholder="Tìm theo mã / tên…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}
      {!disabled && filtered.length > 100 && (
        <small className="text-muted-foreground">100 kết quả đầu; nhập thêm để tìm.</small>
      )}
      <FormError message={error} />
    </div>
  );
}
function Workspace() {
  const router = useRouter();
  const params = useSearchParams();
  const routeKey = params.toString();
  const [master, setMaster] = useState<Master | null>(null);
  const [detail, setDetail] = useState<QuotationDetailResponse | null>(null);
  useDocumentTitle(detail ? `Báo giá ${detail.quote.quotationNo} (v${detail.quote.version})` : "Lập báo giá");
  const [header, setHeader] = useState(blankHeader);
  const [items, setItems] = useState<ServiceItemState[]>([emptyServiceItem("first")]);
  const [baseline, setBaseline] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const [review, setReview] = useState<"APPROVE" | "REJECT" | "RETURN" | null>(null);
  const [comment, setComment] = useState("");
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const discarding = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const status = detail?.quote.status ?? "DRAFT";
  const actor = master && "actor" in master ? master.actor : undefined;
  const { can: canDo, isManager: manager } = usePermission(actor);
  const canEdit = canDo("QUOTATION_EDIT");
  const locked = !canEdit || status !== "DRAFT" || !!detail?.quote.immutableLocked || busy || loading || !!loadError;
  const dirty = !!baseline && commercialFingerprint(header, items) !== baseline;
  const totals = calculateQuotationFinancials(items);
  const missing = items.map((i,index) => ({index, warning: rateWarning(i)})).filter(i => i.warning);
  const item = items[active];
  const activeItemErrors = fieldErrors.items?.[active];
  const authority = evaluateApprovalAuthority(detail?.quote.estimatedMarginPercent ?? totals.estimatedMarginPercent, actor?.role ?? "");
  const ownQuote = !!actor && !!detail && isQuotationAuthor(detail.quote.createdByUserId, detail.quote.createdBy, actor);
  const applyDetail = useCallback((d: QuotationDetailResponse) => {
    const h = {customerId: d.quote.customerId, regionId: d.quote.regionId, commodityId: d.quote.commodityId ?? "", paymentTermsDays: d.quote.paymentTermsDays};
    const lines = restoreQuotationItems(d);
    setDetail(d); setHeader(h); setItems(lines); setActive(0); setBaseline(commercialFingerprint(h, lines));
    setFieldErrors({});
  }, []);
  useEffect(() => {
    let current = true;
    async function init() {
      setLoading(true); setLoadError(""); setError(""); setMessage(""); setFieldErrors({});
      try {
        const m = await getQuotationMasterDataAction();
        if (!current) return;
        if (!m.success) throw new Error(m.error ?? "Không tải được danh mục.");
        setMaster(m);
        const query = new URLSearchParams(routeKey);
        const id = query.get("id");
        if (id) {
          const r = await getQuotationDetailAction(id);
          if (!current) return;
          if (!r.success || !r.data) throw new Error(r.error ?? "Không tải được báo giá.");
          applyDetail(r.data);
        } else {
          const pick = (key: string, options: {id: string}[]) => options.some(o => o.id === query.get(key)) ? query.get(key)! : "";
          const h = {...blankHeader, customerId: pick("customerId",m.customers), commodityId: pick("commodityId",m.commodities)};
          const line = {...emptyServiceItem("first"), originLocationId: pick("origin",m.locations), destinationLocationId: pick("dest",m.locations), equipmentType: pick("eq",m.equipmentTypes)};
          setDetail(null); setHeader(h); setItems([line]); setActive(0); setBaseline(commercialFingerprint(h,[line]));
          setFieldErrors({});
        }
      } catch (e) { if (current) setLoadError(e instanceof Error ? e.message : "Không tải được dữ liệu."); }
      finally { if (current) setLoading(false); }
    }
    const timer = setTimeout(() => void init(), 0); return () => { current = false; clearTimeout(timer); };
  }, [routeKey, retry, applyDetail]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { if (!discarding.current) { event.preventDefault(); event.returnValue = ""; } };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (link && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !link.hasAttribute("download") && link.target !== "_blank" && link.href !== window.location.href) {
        event.preventDefault(); event.stopPropagation(); opener.current = link; setLeaveTarget(link.href);
      }
    };
    window.addEventListener("beforeunload",unload); document.addEventListener("click",navigate,true);
    return () => { window.removeEventListener("beforeunload",unload); document.removeEventListener("click",navigate,true); };
  }, [dirty]);
  async function perform(task: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(""); setMessage("");
    try { await task(); } catch(e) {
      const msg = e instanceof Error ? e.message : "Thao tác thất bại. Vui lòng thử lại.";
      setError(msg);
      toast.error(msg);
    }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function refresh(id: string) {
    const r = await getQuotationDetailAction(id);
    if (!r.success || !r.data) { setLoadError("Đã xử lý nhưng chưa tải lại được báo giá. Hãy tải lại trước khi thao tác tiếp."); throw new Error(r.error ?? "Không tải lại được báo giá."); }
    applyDetail(r.data);
  }
  function updateItem(patch: Partial<ServiceItemState>, route = false) {
    setFieldErrors(prev => {
      if (!prev.items?.[active]) return prev;
      const updatedItemErrors = { ...prev.items[active] };
      for (const k of Object.keys(patch)) {
        delete updatedItemErrors[k as keyof typeof updatedItemErrors];
      }
      return {
        ...prev,
        items: {
          ...prev.items,
          [active]: updatedItemErrors,
        },
      };
    });
    setItems(prev => prev.map((x,i) => i === active ? {...x,...patch,...(route ? {selectedBuyRateId: undefined,selectedCandidate: undefined,lookupResult: undefined,unitBuyPrice: 0,worstCaseBuyPrice: 0} : {})} : x));
  }
  function lookup() {
    if (!item) return;
    const errors: { originLocationId?: string; destinationLocationId?: string; equipmentType?: string } = {};
    if (!item.originLocationId) errors.originLocationId = "Vui lòng chọn điểm đi.";
    if (!item.destinationLocationId) errors.destinationLocationId = "Vui lòng chọn điểm đến.";
    if (item.originLocationId && item.destinationLocationId && item.originLocationId === item.destinationLocationId) {
      errors.destinationLocationId = "Điểm đi và điểm đến phải khác nhau.";
    }
    if (!item.equipmentType) errors.equipmentType = "Vui lòng chọn loại thiết bị.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(prev => ({
        ...prev,
        items: {
          ...prev.items,
          [active]: { ...prev.items?.[active], ...errors },
        },
      }));
      const firstMsg = Object.values(errors)[0];
      setError(firstMsg);
      toast.error(firstMsg);
      return;
    }

    void perform(async () => {
      const result = await lookupRoadRatesAction({pickupLocationId: item.originLocationId, deliveryLocationId: item.destinationLocationId, equipmentType: item.equipmentType, pricingDate: getBusinessDate()});
      setItems(prev => prev.map(x => x.id === item.id ? {...x,lookupResult: result, selectedBuyRateId: undefined,selectedCandidate: undefined,unitBuyPrice:0,worstCaseBuyPrice:result.worstCaseBuy ?? 0} : x));
      if (["ERROR","CONFLICT_RATE","MISSING_RATE"].includes(result.status)) throw new Error(result.message ?? "Không có giá mua phù hợp.");
      setMessage("Chọn một nhà cung cấp trong bảng so sánh.");
    });
  }
  function save(submit: boolean) { void perform(async () => {
    // Validate schema với Zod cho toàn bộ form báo giá
    const payload = {
      customerId: header.customerId,
      regionId: header.regionId,
      commodityId: header.commodityId || undefined,
      paymentTermsDays: header.paymentTermsDays,
      quotationId: detail?.quote.quotationId,
      expectedUpdatedAt: detail?.quote.revision,
      items: items.map(x => ({
        ...x,
        servicePackage: x.servicePackage as ServicePackage,
        totalBuyAmount: 0,
        totalSellPrice: 0,
        itemGp: 0,
        itemMarginPercent: 0,
      })),
    };

    const parsed = createQuotationSchema.safeParse(payload);
    if (!parsed.success) {
      const newErrors: FieldErrors = { items: {} };
      let firstMsg = "";
      for (const issue of parsed.error.issues) {
        if (!firstMsg) firstMsg = issue.message;
        const p = issue.path;
        if (p[0] === "customerId") {
          newErrors.customerId = "Vui lòng chọn khách hàng.";
        } else if (p[0] === "regionId") {
          newErrors.regionId = "Vui lòng chọn vùng phụ trách.";
        } else if (p[0] === "paymentTermsDays") {
          newErrors.paymentTermsDays = issue.message || "Hạn thanh toán không hợp lệ.";
        } else if (p[0] === "items" && typeof p[1] === "number") {
          const idx = p[1];
          const field = String(p[2] || "");
          if (!newErrors.items) newErrors.items = {};
          if (!newErrors.items[idx]) newErrors.items[idx] = {};
          if (field === "destinationLocationId" && issue.message.includes("khác nhau")) {
            newErrors.items[idx].destinationLocationId = "Điểm đến phải khác điểm đi.";
          } else if (field === "originLocationId") {
            newErrors.items[idx].originLocationId = "Vui lòng chọn điểm đi.";
          } else if (field === "destinationLocationId") {
            newErrors.items[idx].destinationLocationId = "Vui lòng chọn điểm đến.";
          } else if (field === "equipmentType") {
            newErrors.items[idx].equipmentType = "Vui lòng chọn loại thiết bị.";
          } else if (field === "plannedQuantity") {
            newErrors.items[idx].plannedQuantity = issue.message || "Số lượng tối thiểu là 1.";
          } else if (field === "unitSellPrice") {
            newErrors.items[idx].unitSellPrice = issue.message || "Đơn giá bán không hợp lệ.";
          }
        }
      }
      setFieldErrors(newErrors);
      const errorIndices = Object.keys(newErrors.items || {}).map(Number);
      if (errorIndices.length > 0 && !errorIndices.includes(active)) {
        setActive(errorIndices[0]);
      }
      throw new Error(firstMsg || "Vui lòng hoàn thiện các trường bắt buộc.");
    }

    setFieldErrors({});

    if (submit && missing.length) throw new Error("Chọn giá mua còn hiệu lực cho tất cả các dòng trước khi gửi duyệt.");
    const result = await saveDraftQuotationAction({...header,quotationId:detail?.quote.quotationId,expectedUpdatedAt:detail?.quote.revision,items:items.map(x => ({...x,servicePackage:x.servicePackage as ServicePackage,totalBuyAmount:0,totalSellPrice:0,itemGp:0,itemMarginPercent:0}))},submit);
    if (!result.success || !result.data) throw new Error(result.error ?? "Không lưu được báo giá.");
    // Record the durable ID before refreshing so a failed reload cannot create a duplicate.
    window.history.replaceState(window.history.state,"",`/quotations/new?id=${result.data.quotationId}`);
    await refresh(result.data.quotationId);
    const saveMsg = submit ? "Đã lưu và gửi duyệt báo giá." : "Đã lưu bản nháp báo giá.";
    setMessage(saveMsg);
    toast.success(saveMsg);
  }); }
  function decide() { if (!detail || !review) return; void perform(async () => {
    if ((review !== "APPROVE" && !comment.trim()) || (review === "APPROVE" && detail.quote.estimatedMarginPercent < 15 && comment.trim().length < 5)) throw new Error("Vui lòng nhập lý do (duyệt biên thấp cần ít nhất 5 ký tự).");
    const fn = review === "APPROVE" ? approveQuotationAction : review === "REJECT" ? rejectQuotationAction : returnQuotationToDraftAction;
    const result = await fn(detail.quote.quotationId,comment.trim());
    if (!result.success) throw new Error(result.error ?? "Không xử lý được yêu cầu.");
    setReview(null);
    await refresh(detail.quote.quotationId);
    const statusMsg = review === "APPROVE" ? "Đã phê duyệt báo giá thành công." : review === "REJECT" ? "Đã từ chối báo giá." : "Đã trả báo giá về bản nháp.";
    setMessage(statusMsg);
    toast.success(statusMsg);
  }); }
  function startReview(action: "APPROVE" | "REJECT" | "RETURN") { opener.current = document.activeElement as HTMLElement; setComment("");setError("");setReview(action); }
  return <div className="space-y-5 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">{detail ? `${detail.quote.quotationNo} · v${detail.quote.version}` : "Lập báo giá"}</h1><div className="mt-2 flex gap-3"><StatusBadge status={status} /><span className="text-sm text-amber-600 dark:text-amber-300">{dirty ? "Có thay đổi chưa lưu" : detail ? "Đã lưu" : "Bản mới"}</span></div></div><div className="flex flex-wrap gap-2"><Link href="/quotations" className="erp-button">Danh sách báo giá</Link>{status === "DRAFT" && canEdit && <><button className="erp-button" disabled={locked} onClick={() => save(false)}>Lưu nháp</button><button className="erp-button bg-blue-600 text-white font-bold" disabled={locked} onClick={() => save(true)}>Lưu và gửi duyệt</button></>}{["APPROVED","SUPERSEDED"].includes(status) && detail && <><Link href={`/quotations/print?id=${detail.quote.quotationId}`} className="erp-button">Bản in khách hàng</Link>{canEdit && status === "APPROVED" && <button className="erp-button" disabled={busy || loading || !!loadError} onClick={() => void perform(async () => { const result = await createQuotationVersionAction(detail.quote.quotationId,detail.quote.revision); if (!result.success) throw new Error(result.error); router.push(`/quotations/new?id=${result.id}`); })}>Tạo phiên bản mới</button>}</>}</div></header>
    {loading && <p role="status">Đang tải báo giá…</p>}{loadError && <div role="alert" className="rounded border border-red-500 p-4">{loadError}<button className="erp-button ml-3" onClick={() => setRetry(x=>x+1)}>Tải lại</button></div>}
    {message && <p role="status" className="rounded border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 p-3">{message}</p>}{error && !review && <p role="alert" className="rounded border border-red-300 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-950 dark:text-red-300 p-3 whitespace-pre-wrap">{error}</p>}
    {!loading && !loadError && <>
      <section className={panel}>
        <h2 className="text-lg font-semibold">1. Thông tin chung</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Choice
            label="Khách hàng"
            value={header.customerId}
            options={master?.customers ?? []}
            disabled={locked}
            error={fieldErrors.customerId}
            onChange={v => {
              setHeader(h => ({...h, customerId: v}));
              setFieldErrors(prev => ({...prev, customerId: undefined}));
            }}
          />
          <Choice
            label="Vùng phụ trách"
            value={header.regionId}
            options={master?.regions ?? []}
            disabled={locked}
            error={fieldErrors.regionId}
            onChange={v => {
              setHeader(h => ({...h, regionId: v}));
              setFieldErrors(prev => ({...prev, regionId: undefined}));
            }}
          />
          <Choice
            label="Hàng hóa (nếu có)"
            value={header.commodityId}
            options={master?.commodities ?? []}
            disabled={locked}
            onChange={v => setHeader(h => ({...h, commodityId: v}))}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium">
              <span className={fieldErrors.paymentTermsDays ? "text-red-600 dark:text-red-400 font-semibold" : ""}>Hạn thanh toán (ngày)</span>
              <input
                className={cn(inputClass, fieldErrors.paymentTermsDays && "border-red-500 focus:ring-red-500 ring-1 ring-red-500/20")}
                type="number"
                min={0}
                max={3650}
                step={1}
                disabled={locked}
                value={header.paymentTermsDays}
                onChange={e => {
                  setHeader(h => ({...h, paymentTermsDays: Number(e.target.value)}));
                  setFieldErrors(prev => ({...prev, paymentTermsDays: undefined}));
                }}
              />
            </label>
            <FormError message={fieldErrors.paymentTermsDays} />
          </div>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className={panel}>
          <div className="flex justify-between gap-3">
            <h2 className="text-lg font-semibold">2. Các dòng dịch vụ</h2>
            <button className="erp-button" disabled={locked || items.length>=200} onClick={()=>{setItems(prev=>[...prev,emptyServiceItem(crypto.randomUUID())]);setActive(items.length);}}>Thêm dòng</button>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table w-full">
              <thead>
                <tr>
                  <th>Dòng</th>
                  <th>Tuyến</th>
                  <th>Số lượng</th>
                  <th>Giá mua / đơn vị</th>
                  <th>Giá bán / đơn vị</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((x,i)=>{
                  const hasItemErr = !!fieldErrors.items?.[i] && Object.keys(fieldErrors.items[i]).length > 0;
                  return (
                    <tr key={x.id} className={active===i ? "bg-blue-50 dark:bg-blue-950/50" : ""}>
                      <td>
                        <button
                          className={`erp-button ${hasItemErr ? "border-red-500 text-red-600 font-bold" : ""}`}
                          disabled={busy}
                          aria-pressed={active===i}
                          onClick={()=>setActive(i)}
                        >
                          {i+1}{hasItemErr ? " (!)" : ""}
                        </button>
                      </td>
                      <td>
                        {master?.locations.find(l=>l.id===x.originLocationId)?.name ?? x.originLocationId ?? ""} → {master?.locations.find(l=>l.id===x.destinationLocationId)?.name ?? x.destinationLocationId ?? ""}
                        <small className="block text-amber-600 dark:text-amber-300">{status === "DRAFT" ? rateWarning(x) : ""}</small>
                      </td>
                      <td>{x.plannedQuantity} {x.unit}</td>
                      <td>{x.selectedBuyRateId ? money(x.unitBuyPrice) : "Chưa có"}</td>
                      <td>{money(x.unitSellPrice)}</td>
                      <td>
                        <button className="erp-button" aria-label={`Xóa dòng ${i+1}`} disabled={locked || items.length<=1} onClick={()=>{setItems(prev=>prev.filter((_,n)=>n!==i));setActive(0);}}>Xóa</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {item && (
            <fieldset disabled={locked} className="space-y-4">
              <legend className="mb-3 font-semibold">Chi tiết dòng {active+1} · {item.servicePackage === "TRUCKING" ? "Vận tải đường bộ" : item.servicePackage}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Choice
                  label="Điểm đi"
                  value={item.originLocationId}
                  options={master?.locations ?? []}
                  disabled={locked}
                  error={activeItemErrors?.originLocationId}
                  onChange={v=>updateItem({originLocationId:v},true)}
                />
                <Choice
                  label="Điểm đến"
                  value={item.destinationLocationId}
                  options={master?.locations ?? []}
                  disabled={locked}
                  error={activeItemErrors?.destinationLocationId}
                  onChange={v=>updateItem({destinationLocationId:v},true)}
                />
                <Choice
                  label="Thiết bị"
                  value={item.equipmentType}
                  options={master?.equipmentTypes ?? []}
                  disabled={locked}
                  error={activeItemErrors?.equipmentType}
                  onChange={v=>updateItem({equipmentType:v},true)}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium">
                    Cách tính phí
                    <select
                      className={inputClass}
                      value={item.pricingInclusion}
                      onChange={e=>updateItem({pricingInclusion:e.target.value as ServiceItemState["pricingInclusion"]})}
                    >
                      <option value="INCLUDED">Trong giá chào</option>
                      <option value="SEPARATELY_BILLED">Thu riêng</option>
                      <option value="PASS_THROUGH_ACTUAL">Thu theo thực tế (tạm tính)</option>
                    </select>
                  </label>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">
                    <span className={activeItemErrors?.plannedQuantity ? "text-red-600 dark:text-red-400 font-semibold" : ""}>Số lượng</span>
                    <QuantityInput
                      disabled={locked}
                      value={item.plannedQuantity}
                      className={activeItemErrors?.plannedQuantity ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""}
                      onValueChange={v=>updateItem({plannedQuantity: v ?? 1})}
                    />
                  </label>
                  <FormError message={activeItemErrors?.plannedQuantity} />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">
                    Đơn vị
                    <input className={inputClass} maxLength={20} value={item.unit} onChange={e=>updateItem({unit:e.target.value})} />
                  </label>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-sm font-medium">
                    <span className={activeItemErrors?.unitSellPrice ? "text-red-600 dark:text-red-400 font-semibold" : ""}>Giá bán / đơn vị (VND)</span>
                    <CurrencyInput
                      disabled={locked}
                      value={item.unitSellPrice}
                      className={activeItemErrors?.unitSellPrice ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20" : ""}
                      onValueChange={v=>updateItem({unitSellPrice: v ?? 0})}
                    />
                  </label>
                  <FormError message={activeItemErrors?.unitSellPrice} />
                </div>
              </div>
              <Button type="button" variant="primary" loading={busy} onClick={lookup}>Tra và so sánh giá NCC</Button>
            </fieldset>
          )}
          {item?.selectedCandidate && <div className="rounded border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-sm text-foreground">Đã chọn: <strong>{item.selectedCandidate.vendorName}</strong> · {money(item.unitBuyPrice)} / {item.unit}<div className="text-muted-foreground">Giá gốc {item.selectedCandidate.buyRate.toLocaleString("vi-VN")} {item.selectedCandidate.currency} · Hiệu lực {item.selectedCandidate.validityStart} → trước {item.selectedCandidate.validityEnd}</div></div>}
          {!!item?.lookupResult?.candidates.length && <div className="overflow-x-auto"><p className="mb-2 text-sm text-muted-foreground">So sánh theo đơn giá quy đổi VND. Tỷ giá theo cấu hình nội bộ; chọn NCC để xác nhận.</p><table className="erp-table w-full"><thead><tr><th>NCC</th><th>Giá gốc</th><th>Tỷ giá</th><th>Quy đổi VND</th><th>Hiệu lực [từ, đến)</th><th /></tr></thead><tbody>{item.lookupResult.candidates.map(candidate=><tr key={candidate.rateId}><td>{candidate.vendorName}</td><td>{candidate.buyRate.toLocaleString("vi-VN")} {candidate.currency}</td><td>{candidate.fxRateToVnd}</td><td>{money(candidate.buyRateVnd)}</td><td>{candidate.validityStart} → {candidate.validityEnd}</td><td><button className="erp-button" disabled={locked || ["ERROR","CONFLICT_RATE"].includes(item.lookupResult!.status)} onClick={()=>updateItem({selectedCandidate:candidate,selectedBuyRateId:candidate.rateId,unitBuyPrice:candidate.buyRateVnd})}>{item.selectedBuyRateId===candidate.rateId ? "Đã chọn" : "Chọn NCC"}</button></td></tr>)}</tbody></table></div>}
        </section>
        <aside className={`${panel} self-start xl:sticky xl:top-4`}><h2 className="text-lg font-semibold">3. Tổng hợp nội bộ</h2>{status === "DRAFT" && missing.length>0 && <p role="status" className="text-sm text-amber-600 dark:text-amber-300">{missing.length} dòng thiếu giá hợp lệ. Chi phí và lợi nhuận chưa đầy đủ.</p>}<dl className="space-y-3">{[["Doanh thu",money(totals.totalSellAmount)],["Chi phí dự kiến",money(totals.totalEstimatedBuy)],["Chi phí cao nhất",money(totals.totalWorstCaseBuy)],["Lợi nhuận dự kiến",missing.length && status === "DRAFT" ? "Chưa đủ dữ liệu" : money(totals.estimatedGp)],["Biên lợi nhuận",missing.length && status === "DRAFT" ? "Chưa đủ dữ liệu" : `${totals.estimatedMarginPercent.toFixed(2)}%`]].map(([label,value])=><div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-lg font-semibold">{value}</dd></div>)}</dl><p className="text-xs text-muted-foreground">Tổng gồm các dòng tạm tính; cách thu phí được ghi riêng trên bản chào. Giá được kiểm tra và tính lại khi lưu.</p><p className="text-sm">Cấp duyệt: {authority.requiredRole === "DIRECTOR" ? "Giám đốc" : "Trưởng phòng định giá"}{authority.isBodEscalation ? " · Ngoại lệ biên thấp" : ""}</p></aside>
      </div>
      {detail && <section className={panel}><h2 className="text-lg font-semibold">Thẩm định và lịch sử</h2>{ownQuote && status === "PENDING_APPROVAL" && <p className="text-amber-600 dark:text-amber-300">Người lập không tự duyệt báo giá của mình.</p>}{status === "PENDING_APPROVAL" && !authority.allowed && <p className="text-sm text-muted-foreground">{authority.reason}</p>}<div className="flex flex-wrap gap-2">{status === "PENDING_APPROVAL" && <>{authority.allowed && !ownQuote && <button className="erp-button bg-emerald-700 text-white" disabled={busy} onClick={()=>startReview("APPROVE")}>Duyệt báo giá</button>}{manager && <button className="erp-button" disabled={busy} onClick={()=>startReview("REJECT")}>Từ chối</button>}</>}{manager && ["PENDING_APPROVAL","REJECTED"].includes(status) && <button className="erp-button" disabled={busy} onClick={()=>startReview("RETURN")}>Trả về nháp</button>}</div>{detail.approvalLogs.length ? <ol className="space-y-3">{detail.approvalLogs.map(log=><li key={log.logId} className="border-l-2 border-border pl-3"><strong>{log.action}</strong> · {log.actorName ?? log.actorId} · v{log.version}<div className="text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString("vi-VN")} · {log.comment ?? ""}</div></li>)}</ol> : <p className="text-sm text-muted-foreground">Chưa có sự kiện thẩm định.</p>}</section>}
    </>}
    <Dialog.Root open={!!leaveTarget} onOpenChange={value=>{if(!value)setLeaveTarget(null);}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" /><Dialog.Content onCloseAutoFocus={e=>{e.preventDefault();opener.current?.focus();}} className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 text-foreground space-y-4 shadow-2xl"><Dialog.Title className="text-xl font-semibold">Có thay đổi chưa lưu</Dialog.Title><Dialog.Description className="text-muted-foreground">Bạn có muốn bỏ các thay đổi và rời màn hình báo giá?</Dialog.Description><div className="flex flex-wrap gap-2"><Dialog.Close className="erp-button">Ở lại để lưu</Dialog.Close><button className="erp-button bg-red-700 text-white" onClick={()=>{if(!leaveTarget)return;const target=new URL(leaveTarget);discarding.current=true;setLeaveTarget(null);if(target.origin===window.location.origin)router.push(target.pathname+target.search+target.hash);else window.location.href=target.href;}}>Bỏ thay đổi và rời trang</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={!!review} onOpenChange={value=>{if(!value && !busy)setReview(null);}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" /><Dialog.Content onCloseAutoFocus={e=>{e.preventDefault();opener.current?.focus();}} className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 text-foreground space-y-4 shadow-2xl"><Dialog.Title className="text-xl font-semibold">{review === "APPROVE" ? "Duyệt báo giá" : review === "REJECT" ? "Từ chối báo giá" : "Trả về nháp"}</Dialog.Title><Dialog.Description className="text-muted-foreground">Thao tác được lưu vào lịch sử. Duyệt báo giá sẽ khóa nội dung thương mại của phiên bản này.</Dialog.Description><label className="block">Ý kiến / lý do<textarea className={inputClass} maxLength={2000} rows={4} disabled={busy} value={comment} onChange={e=>setComment(e.target.value)} /></label>{error && <p role="alert" className="text-red-600 dark:text-red-300">{error}</p>}<div className="flex gap-2"><button className="erp-button bg-blue-600 text-white font-bold" disabled={busy} onClick={decide}>Xác nhận</button><Dialog.Close className="erp-button" disabled={busy}>Hủy</Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
export default function QuotationWorkspacePage() { return <Suspense fallback={<p>Đang tải báo giá…</p>}><Workspace /></Suspense>; }
