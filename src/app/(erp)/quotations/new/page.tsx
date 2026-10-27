"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Search,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight,
  DollarSign,
  ShieldAlert,
  Save,
  Send,
  Building,
  Check,
  XCircle,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { restoreQuotationItems, ServiceItemState } from "@/features/quotation/editor-state";
import { calculateQuotationFinancials, getBusinessDate } from "@/shared/utils/pricing";
import { ServicePackage } from "@/shared/schemas/quotation.schema";
import {
  getQuotationMasterDataAction,
  getQuotationDetailAction,
  lookupRoadRatesAction,
  saveDraftQuotationAction,
  approveQuotationAction,
  rejectQuotationAction,
  returnQuotationToDraftAction,
} from "@/features/quotation/actions";
import type { RateCandidate } from "@/server/modules/supplier-pricing/rate-lookup.service";
import { MasterOption } from "@/server/modules/master-data/master-data.service";

function QuotationWorkspaceContent() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");
  const customerIdFromUrl = searchParams.get("customerId");
  const originFromUrl = searchParams.get("origin");
  const destFromUrl = searchParams.get("dest");
  const eqFromUrl = searchParams.get("eq");
  const commodityIdFromUrl = searchParams.get("commodityId");

  const [isPending, startTransition] = useTransition();

  // Master Data state
  const [customers, setCustomers] = useState<MasterOption[]>([]);
  const [regions, setRegions] = useState<MasterOption[]>([]);
  const [locations, setLocations] = useState<MasterOption[]>([]);
  const [commodities, setCommodities] = useState<MasterOption[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<{ id: string; name: string }[]>([]);

  // Form Header State
  const [customerId, setCustomerId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [commodityId, setCommodityId] = useState("");
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);

  // Service Items State (ORDER_SERVICE_ITEMS)
  const [items, setItems] = useState<ServiceItemState[]>([
    {
      id: "item-1",
      servicePackage: "TRUCKING",
      pricingInclusion: "INCLUDED",
      originLocationId: "",
      destinationLocationId: "",
      equipmentType: "40HC",
      plannedQuantity: 1,
      unit: "TRIP",
      unitBuyPrice: 0,
      worstCaseBuyPrice: 0,
      unitSellPrice: 0,
    },
  ]);

  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Result state
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);
  const [revision, setRevision] = useState<string | undefined>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [savedQuotationNo, setSavedQuotationNo] = useState<string | null>(null);
  const [quotationStatus, setQuotationStatus] = useState<"DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED">("DRAFT");
  const [isImmutableLocked, setIsImmutableLocked] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isReadOnly = isImmutableLocked || quotationStatus !== "DRAFT" || isPending || loadFailed;

  // Load Master Data & Existing Quotation if ID provided
  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      setLoadFailed(false);
      setSavedQuotationId(null);
      setSavedQuotationNo(null);
      setRevision(undefined);
      setQuotationStatus("DRAFT");
      setIsImmutableLocked(false);
      setActiveItemIndex(0);
      setActionMessage(null);
      const res = await getQuotationMasterDataAction();
      if (cancelled) return;
      setCustomers(res.customers);
      setRegions(res.regions);
      setLocations(res.locations);
      setCommodities(res.commodities);
      setEquipmentTypes(res.equipmentTypes);

      if (res.error) {
        setLoadFailed(true);
        setActionMessage({
          type: "error",
          text: `${res.error}. Vui lòng kiểm tra kết nối PostgreSQL.`,
        });
      }

      if (idFromUrl) {
        // Tải thông tin báo giá đã có
        const detailRes = await getQuotationDetailAction(idFromUrl);
        if (cancelled) return;
        if (detailRes.success && detailRes.data) {
          const q = detailRes.data.quote;
          setRevision(q.revision);
          setSavedQuotationId(q.quotationId);
          setSavedQuotationNo(q.quotationNo);
          setQuotationStatus(q.status as "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED");
          setIsImmutableLocked(q.immutableLocked);
          setCustomerId(q.customerId);
          setRegionId(q.regionId);
          setCommodityId(q.commodityId || "");
          setPaymentTermsDays(q.paymentTermsDays);

          if (detailRes.data.items && detailRes.data.items.length > 0) {
            setItems(restoreQuotationItems(detailRes.data));
          }
        } else {
          setLoadFailed(true);
          setActionMessage({ type: "error", text: detailRes.error || "Không thể tải báo giá." });
        }
      } else {
        // Thiết lập giá trị mặc định hoặc từ URL query parameters
        const defaultCustomer = customerIdFromUrl || (res.customers.length > 0 ? res.customers[0].id : "");
        setCustomerId(defaultCustomer);
        if (res.regions.length > 0) setRegionId(res.regions[0].id);
        const defaultCommodity = commodityIdFromUrl || (res.commodities.length > 0 ? res.commodities[0].id : "");
        setCommodityId(defaultCommodity);

        const origin = originFromUrl || (res.locations.length > 0 ? res.locations[0].id : "");
        const dest = destFromUrl || (res.locations.length > 1 ? res.locations[1].id : "");
        const eq = eqFromUrl || "40HC";

        setItems([
          {
            id: "item-1",
            servicePackage: "TRUCKING",
            pricingInclusion: "INCLUDED",
            originLocationId: origin,
            destinationLocationId: dest,
            equipmentType: eq,
            plannedQuantity: 1,
            unit: "TRIP",
            unitBuyPrice: 0,
            worstCaseBuyPrice: 0,
            unitSellPrice: 0,
          },
        ]);
      }
    });
    return () => { cancelled = true; };
  }, [idFromUrl, customerIdFromUrl, originFromUrl, destFromUrl, eqFromUrl, commodityIdFromUrl]);

  const currentItem = items[activeItemIndex] || items[0];

  // Helper Tra cứu giá mua đầu vào (BUY Rate Lookup)
  const handleLookupRate = (index: number) => {
    const item = items[index];
    if (!item.originLocationId || !item.destinationLocationId || !item.equipmentType) {
      alert("Vui lòng chọn đầy đủ Điểm xếp hàng, Điểm dỡ hàng và Loại thiết bị");
      return;
    }

    startTransition(async () => {
      const result = await lookupRoadRatesAction({
        pickupLocationId: item.originLocationId,
        deliveryLocationId: item.destinationLocationId,
        equipmentType: item.equipmentType,
        pricingDate: getBusinessDate(),
      });

      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx !== index) return it;
          const selected = result.status === "APPLY" || result.status === "MULTIPLE_CANDIDATES" ? result.selectedRate : undefined;
          return {
            ...it,
            lookupResult: result,
            selectedCandidate: selected,
            selectedBuyRateId: selected?.rateId,
            unitBuyPrice: selected ? selected.buyRateVnd : 0,
            worstCaseBuyPrice: result.worstCaseBuy || 0,
          };
        })
      );
    });
  };

  // Chọn nhà cung cấp ứng viên (PR-04 Server-Authoritative)
  const handleSelectCandidate = (index: number, candidate: RateCandidate) => {
    if (items[index].lookupResult?.status === "CONFLICT_RATE" || items[index].lookupResult?.status === "ERROR") return;
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        return {
          ...it,
          selectedCandidate: candidate,
          selectedBuyRateId: candidate.rateId,
          unitBuyPrice: candidate.buyRateVnd,
        };
      })
    );
  };

  // Thêm gói dịch vụ mới
  const handleAddItem = () => {
    const newItem: ServiceItemState = {
      id: `item-${Date.now()}`,
      servicePackage: "TRUCKING",
      pricingInclusion: "INCLUDED",
      originLocationId: locations[0]?.id || "",
      destinationLocationId: locations[1]?.id || "",
      equipmentType: "40HC",
      plannedQuantity: 1,
      unit: "TRIP",
      unitBuyPrice: 0,
      worstCaseBuyPrice: 0,
      unitSellPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
    setActiveItemIndex(items.length);
  };

  // Xóa dịch vụ
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (activeItemIndex >= items.length - 1) {
      setActiveItemIndex(Math.max(0, items.length - 2));
    }
  };

  // Tính toán Tổng tài chính P&L
  const { totalSellAmount: totalSell, totalEstimatedBuy: totalBuy, totalWorstCaseBuy: totalWorstBuy,
    estimatedGp: grossProfit, estimatedMarginPercent: marginPercent } = calculateQuotationFinancials(items);

  // Lưu Báo giá Nháp (Create vs Update Draft)
  const persistDraft = (submit: boolean) => {
    startTransition(async () => {
      const res = await saveDraftQuotationAction({
        quotationId: savedQuotationId || undefined,
        expectedUpdatedAt: revision,
        customerId,
        regionId,
        commodityId,
        paymentTermsDays,
        items: items.map((it) => ({
          servicePackage: it.servicePackage as ServicePackage,
          pricingInclusion: it.pricingInclusion,
          originLocationId: it.originLocationId,
          destinationLocationId: it.destinationLocationId,
          equipmentType: it.equipmentType,
          plannedQuantity: it.plannedQuantity,
          unit: it.unit,
          selectedBuyRateId: it.selectedBuyRateId,
          selectedVendorId: it.selectedCandidate?.vendorId,
          selectedVendorName: it.selectedCandidate?.vendorName,
          unitBuyPrice: it.unitBuyPrice,
          worstCaseBuyPrice: it.worstCaseBuyPrice,
          totalBuyAmount: it.unitBuyPrice * it.plannedQuantity,
          unitSellPrice: it.unitSellPrice,
          totalSellPrice: it.unitSellPrice * it.plannedQuantity,
          itemGp: (it.unitSellPrice - it.unitBuyPrice) * it.plannedQuantity,
          itemMarginPercent: it.unitSellPrice > 0 ? ((it.unitSellPrice - it.unitBuyPrice) / it.unitSellPrice) * 100 : 0,
        })),
      }, submit);

      if (res.success && res.data) {
        setSavedQuotationId(res.data.quotationId || null);
        setSavedQuotationNo(res.data.quotationNo);
        setRevision(res.data.revision);
        setQuotationStatus(res.data.status);
        setItems((previous) => previous.map((item, index) => ({ ...item, ...res.data.items[index] })));
        setActionMessage({
          type: "success",
          text: submit ? `Đã lưu và trình duyệt báo giá [${res.data.quotationNo}].` : `Đã lưu báo giá nháp [${res.data.quotationNo}].`,
        });
      } else {
        setActionMessage({ type: "error", text: res.error || "Lỗi khi lưu báo giá" });
      }
    });
  };

  const handleSaveDraft = () => persistDraft(false);
  const handleSubmitForApproval = () => persistDraft(true);

  // Phê duyệt Báo giá
  const handleApprove = () => {
    if (!savedQuotationId) return;
    let comment: string | undefined;

    if (marginPercent < 15) {
      const input = prompt(
        `Biên lợi nhuận (${marginPercent.toFixed(1)}%) dưới 15%. Vui lòng nhập lý do phê duyệt ngoại lệ:`
      );
      if (!input || input.trim().length < 5) {
        alert("Bắt buộc nhập lý do giải trình khi biên lợi nhuận < 15%.");
        return;
      }
      comment = input.trim();
    }

    startTransition(async () => {
      const res = await approveQuotationAction(savedQuotationId, comment);
      if (res.success) {
        setQuotationStatus("APPROVED");
        setIsImmutableLocked(true);
        setActionMessage({
          type: "success",
          text: res.message || "Báo giá đã được PHÊ DUYỆT CHÍNH THỨC và KHÓA BẤT BIẾN.",
        });
      } else {
        setActionMessage({ type: "error", text: res.error || "Lỗi khi phê duyệt báo giá" });
      }
    });
  };

  // Từ chối Báo giá
  const handleReject = () => {
    if (!savedQuotationId) return;
    const comment = prompt("Vui lòng nhập lý do từ chối báo giá:");
    if (!comment) return;
    startTransition(async () => {
      const res = await rejectQuotationAction(savedQuotationId, comment);
      if (res.success) {
        setQuotationStatus("REJECTED");
        setActionMessage({
          type: "success",
          text: res.message || "Báo giá đã bị từ chối.",
        });
      } else {
        setActionMessage({ type: "error", text: res.error || "Lỗi khi từ chối báo giá" });
      }
    });
  };

  // Trả về Bản Nháp để chỉnh sửa
  const handleReturnToDraft = () => {
    if (!savedQuotationId) return;
    const comment = prompt("Vui lòng nhập ý kiến yêu cầu điều chỉnh lại báo giá:");
    if (!comment) return;
    startTransition(async () => {
      const res = await returnQuotationToDraftAction(savedQuotationId, comment);
      if (res.success) {
        setQuotationStatus("DRAFT");
        const refreshed = await getQuotationDetailAction(savedQuotationId);
        if (refreshed.success && refreshed.data) setRevision(refreshed.data.quote.revision);
        setIsImmutableLocked(false);
        setActionMessage({
          type: "success",
          text: res.message || "Báo giá đã được mở lại ở trạng thái NHÁP để chỉnh sửa.",
        });
      } else {
        setActionMessage({ type: "error", text: res.error || "Lỗi khi trả về bản nháp" });
      }
    });
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(num)) + " đ";
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Không Gian Lập Báo Giá Thương Mại
            </h1>
            {savedQuotationNo && (
              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                {savedQuotationNo}
              </span>
            )}
            {quotationStatus === "DRAFT" && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs font-bold border border-slate-700">
                BẢN NHÁP (DRAFT)
              </span>
            )}
            {quotationStatus === "PENDING_APPROVAL" && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                CHỜ PHÊ DUYỆT
              </span>
            )}
            {quotationStatus === "APPROVED" && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3" />
                ĐÃ PHÊ DUYỆT (KHÓA BẤT BIẾN)
              </span>
            )}
            {quotationStatus === "REJECTED" && (
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                BỊ TỪ CHỐI
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Quy chuẩn P0 & P1: Tra cứu đa Nhà cung cấp, snapshot giá vốn, cấu thành giá bán SELL và ma trận phê duyệt biên lợi nhuận
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/quotations"
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Danh Sách Báo Giá</span>
          </Link>

          {quotationStatus === "DRAFT" && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={isReadOnly}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-slate-400" />
                Lưu Nháp
              </button>
              <button
                onClick={handleSubmitForApproval}
                disabled={isReadOnly}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Trình Duyệt Hội Đồng
              </button>
            </>
          )}

          {quotationStatus === "PENDING_APPROVAL" && (
            <>
              <button
                onClick={handleReturnToDraft}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Trả Về Nháp
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Từ Chối
              </button>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Phê Duyệt
              </button>
            </>
          )}

          {quotationStatus === "REJECTED" && (
            <button
              onClick={handleReturnToDraft}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Mở Lại Bản Nháp
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Immutable Locked Banner */}
      {isImmutableLocked && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Hồ Sơ Đã Khóa Bất Biến:</strong> Báo giá này đã được thẩm định phê duyệt chính thức. Toàn bộ thông tin giá bán và giá vốn được bảo vệ tính toán toàn vẹn, không thể chỉnh sửa.
          </span>
        </div>
      )}

      {/* 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: 4 / 12 - Thông tin thương mại & Danh mục dịch vụ */}
        {/* ==================================================================== */}
        <div className="lg:col-span-4 space-y-4">
          {/* Box 1: Thông tin khách hàng & phân vùng */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                Khách Hàng & Phân Vùng
              </span>
              <span className="text-[10px] text-slate-500 font-mono">BƯỚC 01</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Khách Hàng Mục Tiêu *</label>
                <select
                  disabled={isReadOnly}
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Phân Vùng Vận Hành (Region Scope) *</label>
                <select
                  disabled={isReadOnly}
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Mặt Hàng Vận Chuyển</label>
                <select
                  disabled={isReadOnly}
                  value={commodityId}
                  onChange={(e) => setCommodityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {commodities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Hạn Nợ Thương Mại</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400 shrink-0">ngày</span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Danh sách gói dịch vụ */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Gói Dịch Vụ ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isReadOnly}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Thêm Dịch Vụ
              </button>
            </div>

            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItemIndex(idx)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    activeItemIndex === idx
                      ? "bg-blue-600/10 border-blue-500/40 shadow-sm"
                      : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">
                      #{idx + 1}. {item.servicePackage === "TRUCKING" ? "Vận tải Đường bộ" : item.servicePackage}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-slate-400">
                        {item.plannedQuantity} {item.unit}
                      </span>
                      {items.length > 1 && !isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(idx);
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1 truncate">
                    <span>{locations.find((l) => l.id === item.originLocationId)?.code || "Điểm đi"}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span>{locations.find((l) => l.id === item.destinationLocationId)?.code || "Điểm đến"}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-cyan-400">{item.equipmentType}</span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Giá vốn BUY:</span>
                    <span
                      className={`font-semibold font-mono ${
                        item.unitBuyPrice > 0 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {item.unitBuyPrice > 0 ? formatVND(item.unitBuyPrice) : "Chưa tra cứu"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: 8 / 12 - Tra cứu giá mua BUY, cấu thành giá SELL & P&L */}
        {/* ==================================================================== */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Tuyến vận chuyển & BUY Rate Lookup Engine */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wide">
                  Chi Tiết Tuyến #{activeItemIndex + 1} & Tra Cứu Giá Mua (BUY Engine)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Gói: <strong className="text-blue-400">{currentItem.servicePackage}</strong>
              </span>
            </div>

            {/* Các dropdown tuyến đường */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Điểm Nhận / Xếp Hàng *</label>
                <select
                  disabled={isReadOnly}
                  value={currentItem.originLocationId}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, idx) =>
                        idx === activeItemIndex
                          ? {
                              ...it,
                              originLocationId: e.target.value,
                              lookupResult: undefined,
                              selectedCandidate: undefined,
                              selectedBuyRateId: undefined,
                              unitBuyPrice: 0,
                              worstCaseBuyPrice: 0,
                            }
                          : it
                      )
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Điểm Giao / Dỡ Hàng *</label>
                <select
                  disabled={isReadOnly}
                  value={currentItem.destinationLocationId}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, idx) =>
                        idx === activeItemIndex
                          ? {
                              ...it,
                              destinationLocationId: e.target.value,
                              lookupResult: undefined,
                              selectedCandidate: undefined,
                              selectedBuyRateId: undefined,
                              unitBuyPrice: 0,
                              worstCaseBuyPrice: 0,
                            }
                          : it
                      )
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Loại Thiết Bị / Phương Tiện *</label>
                <select
                  disabled={isReadOnly}
                  value={currentItem.equipmentType}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, idx) =>
                        idx === activeItemIndex
                          ? {
                              ...it,
                              equipmentType: e.target.value,
                              lookupResult: undefined,
                              selectedCandidate: undefined,
                              selectedBuyRateId: undefined,
                              unitBuyPrice: 0,
                              worstCaseBuyPrice: 0,
                            }
                          : it
                      )
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {equipmentTypes.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Số lượng chuyến & Nút tra cứu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Số lượng dự kiến:</span>
                <input
                  type="number"
                  min="1"
                  disabled={isReadOnly}
                  value={currentItem.plannedQuantity}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, idx) =>
                        idx === activeItemIndex ? { ...it, plannedQuantity: Math.max(1, Number(e.target.value)) } : it
                      )
                    )
                  }
                  className="w-20 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono text-center focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-400">{currentItem.unit}</span>
              </div>

              <button
                type="button"
                onClick={() => handleLookupRate(activeItemIndex)}
                disabled={isReadOnly}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                Tra Cứu Giá Mua (130 Road Rates)
              </button>
            </div>

            {/* Kết Quả Tra Cứu Giá Mua BUY */}
            {currentItem.lookupResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">Kết Quả Tra Cứu:</span>
                    {currentItem.lookupResult.status === "MULTIPLE_CANDIDATES" && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold text-xs border border-blue-500/30">
                        {currentItem.lookupResult.candidates.length} Nhà cung cấp hợp lệ
                      </span>
                    )}
                    {currentItem.lookupResult.status === "APPLY" && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold text-xs border border-emerald-500/30">
                        Áp Dụng Tự Động (01 Nhà cung cấp)
                      </span>
                    )}
                    {currentItem.lookupResult.status === "MISSING_RATE" && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold text-xs border border-amber-500/30">
                        Chưa có giá mua cho tuyến này
                      </span>
                    )}
                  </div>

                  {currentItem.worstCaseBuyPrice > 0 && (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Worst-case BUY: </span>
                      <strong className="text-xs font-mono text-amber-400">
                        {formatVND(currentItem.worstCaseBuyPrice)}
                      </strong>
                    </div>
                  )}
                </div>

                {currentItem.lookupResult.message && (
                  <p role="alert" className="text-xs text-amber-300">{currentItem.lookupResult.message}</p>
                )}
                {(currentItem.lookupResult.status === "APPLY" || currentItem.lookupResult.status === "MULTIPLE_CANDIDATES") && currentItem.lookupResult.candidates.length > 0 && (
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Lựa Chọn</th>
                          <th className="py-2 px-3">Nhà Cung Cấp / Đơn Vị</th>
                          <th className="py-2 px-3">Khoảng Hiệu Lực</th>
                          <th className="py-2 px-3 text-right">Đơn Giá Mua (BUY)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {currentItem.lookupResult.candidates.map((cand) => {
                          const isSelected = currentItem.selectedCandidate?.vendorId === cand.vendorId;
                          return (
                            <tr
                              key={cand.rateId}
                              onClick={() => !isReadOnly && handleSelectCandidate(activeItemIndex, cand)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? "bg-blue-600/15 text-white" : "hover:bg-slate-900/50 text-slate-300"
                              }`}
                            >
                              <td className="py-2 px-3">
                                <input
                                  type="radio"
                                  name={`candidate-${currentItem.id}`}
                                  checked={isSelected}
                                  onChange={() => {}}
                                  disabled={isReadOnly}
                                  className="text-blue-500 focus:ring-0"
                                />
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-200">
                                {cand.vendorName}
                              </td>
                              <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                                {cand.validityRange}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                                <div>{formatVND(cand.buyRateVnd)}</div>
                                {cand.currency !== "VND" && (
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    ({new Intl.NumberFormat().format(cand.buyRate)} {cand.currency})
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Cấu thành giá SELL & Live P&L */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <span className="font-bold text-xs text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-400" />
                Cấu Thành Giá Bán (SELL) & Hiệu Quả Kinh Doanh (P&L Matrix)
              </span>
              <span className="text-xs text-slate-400">Đơn vị: <strong>VND</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Đơn Giá Bán Đề Xuất (SELL / {currentItem.unit}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="500000"
                    disabled={isReadOnly}
                    value={currentItem.unitSellPrice}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((it, idx) =>
                          idx === activeItemIndex ? { ...it, unitSellPrice: Number(e.target.value) } : it
                        )
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">VND</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tổng Giá Bán Dịch Vụ Này</label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-blue-400">
                  {formatVND((currentItem.unitSellPrice || 0) * (currentItem.plannedQuantity || 1))}
                </div>
              </div>
            </div>

            {/* LIVE KPI METRICS CỦA TOÀN BỘ BÁO GIÁ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2.5 border-t border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Doanh Thu (SELL)</span>
                <span className="text-base font-black font-mono text-white block mt-0.5">
                  {formatVND(totalSell)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Giá Vốn (BUY)</span>
                <span className="text-base font-black font-mono text-amber-400 block mt-0.5">
                  {formatVND(totalBuy)}
                </span>
                {totalWorstBuy > 0 && (
                  <span className="text-[10px] text-slate-500 font-mono block">Worst: {formatVND(totalWorstBuy)}</span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Lợi Nhuận Gộp (GP)</span>
                <span
                  className={`text-base font-black font-mono block mt-0.5 ${
                    grossProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatVND(grossProfit)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Biên Lợi Nhuận</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`text-base font-black font-mono ${
                      marginPercent >= 15
                        ? "text-emerald-400"
                        : marginPercent >= 5
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {marginPercent.toFixed(1)}%
                  </span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                      marginPercent >= 15
                        ? "bg-emerald-500/20 text-emerald-300"
                        : marginPercent >= 5
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {marginPercent >= 15 ? "Chuẩn" : marginPercent >= 5 ? "Cần Duyệt" : "Dưới Sàn"}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông báo chính sách margin THILOGI */}
            <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/30 text-[11px] text-blue-300/90 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Chính sách Margin THILOGI:</strong> Biên lợi nhuận $\ge 15\%$ được phê duyệt nhanh bởi Trưởng bộ phận Pricing. Từ $5\% - 15\%$ yêu cầu thẩm định Phó Giám Đốc. Dưới $5\%$ chỉ được duyệt khi có chủ trương bù tải của Ban Giám Đốc.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewQuotationWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          Đang khởi tạo Không Gian Báo Giá...
        </div>
      }
    >
      <QuotationWorkspaceContent />
    </Suspense>
  );
}
