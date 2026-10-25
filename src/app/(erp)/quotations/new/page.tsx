"use client";

import { useEffect, useState, useTransition } from "react";
import {
  FileText,
  Search,
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
} from "lucide-react";
import { ServicePackage } from "@/shared/schemas/quotation.schema";
import {
  getQuotationMasterDataAction,
  lookupRoadRatesAction,
  saveDraftQuotationAction,
  submitQuotationAction,
} from "@/features/quotation/actions";
import { RateLookupResult, RateCandidate } from "@/server/modules/supplier-pricing/rate-lookup.service";
import { MasterOption } from "@/server/modules/master-data/master-data.service";

interface ServiceItemState {
  id: string;
  servicePackage: string;
  originLocationId: string;
  destinationLocationId: string;
  equipmentType: string;
  plannedQuantity: number;
  unit: string;

  // BUY Side
  lookupResult?: RateLookupResult;
  selectedCandidate?: RateCandidate;
  unitBuyPrice: number;
  worstCaseBuyPrice: number;

  // SELL Side
  unitSellPrice: number;
}

export default function NewQuotationWorkspacePage() {
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
      originLocationId: "LOC_PORT_CHULAI",
      destinationLocationId: "LOC_PORT_TIENSA",
      equipmentType: "40HC",
      plannedQuantity: 5,
      unit: "TRIP",
      unitBuyPrice: 0,
      worstCaseBuyPrice: 0,
      unitSellPrice: 5500000, // Giá bán dự kiến: 5.500.000 đ
    },
  ]);

  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Result state
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);
  const [savedQuotationNo, setSavedQuotationNo] = useState<string | null>(null);
  const [isImmutableLocked, setIsImmutableLocked] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load Master Data
  useEffect(() => {
    startTransition(async () => {
      const data = await getQuotationMasterDataAction();
      setCustomers(data.customers);
      setRegions(data.regions);
      setLocations(data.locations);
      setCommodities(data.commodities);
      setEquipmentTypes(data.equipmentTypes);

      if (data.customers.length > 0) setCustomerId(data.customers[0].id);
      if (data.regions.length > 0) setRegionId(data.regions[0].id);
      if (data.commodities.length > 0) setCommodityId(data.commodities[0].id);
    });
  }, []);

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
        pricingDate: new Date().toISOString().split("T")[0],
      });

      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx !== index) return it;
          const selected = result.selectedRate || (result.candidates.length > 0 ? result.candidates[0] : undefined);
          return {
            ...it,
            lookupResult: result,
            selectedCandidate: selected,
            unitBuyPrice: selected ? selected.buyRate : 0,
            worstCaseBuyPrice: result.worstCaseBuy || 0,
          };
        })
      );
    });
  };

  // Chọn nhà cung cấp ứng viên
  const handleSelectCandidate = (index: number, candidate: RateCandidate) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        return {
          ...it,
          selectedCandidate: candidate,
          unitBuyPrice: candidate.buyRate,
        };
      })
    );
  };

  // Thêm gói dịch vụ mới
  const handleAddItem = () => {
    const newItem: ServiceItemState = {
      id: `item-${Date.now()}`,
      servicePackage: "TRUCKING",
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
  const totalSell = items.reduce((acc, it) => acc + (it.unitSellPrice || 0) * (it.plannedQuantity || 1), 0);
  const totalBuy = items.reduce((acc, it) => acc + (it.unitBuyPrice || 0) * (it.plannedQuantity || 1), 0);
  const totalWorstBuy = items.reduce((acc, it) => acc + (it.worstCaseBuyPrice || 0) * (it.plannedQuantity || 1), 0);
  const grossProfit = totalSell - totalBuy;
  const marginPercent = totalSell > 0 ? (grossProfit / totalSell) * 100 : 0;

  // Lưu Báo giá Nháp
  const handleSaveDraft = () => {
    startTransition(async () => {
      const res = await saveDraftQuotationAction({
        customerId,
        regionId,
        commodityId,
        paymentTermsDays,
        items: items.map((it) => ({
          servicePackage: it.servicePackage as ServicePackage,
          pricingInclusion: "INCLUDED",
          originLocationId: it.originLocationId,
          destinationLocationId: it.destinationLocationId,
          equipmentType: it.equipmentType,
          plannedQuantity: it.plannedQuantity,
          unit: it.unit,
          selectedBuyRateId: it.selectedCandidate?.rateId,
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
      });

      if (res.success && res.data) {
        setSavedQuotationId(res.data.quotationId);
        setSavedQuotationNo(res.data.quotationNo);
        setActionMessage({
          type: "success",
          text: `Đã lưu thành công Báo giá Nháp [${res.data.quotationNo}].`,
        });
      } else {
        setActionMessage({ type: "error", text: res.error || "Lỗi khi lưu báo giá" });
      }
    });
  };

  // Trình Thẩm định & Khóa Bất Biến (Immutable Lock)
  const handleSubmitForApproval = () => {
    // Kiểm tra có thiếu giá mua đầu vào không (P0 rule)
    const hasMissingBuy = items.some((it) => it.unitBuyPrice === 0);
    if (hasMissingBuy) {
      alert("CẢNH BÁO QUY TẮC P0: Không thể trình duyệt khi còn dịch vụ thiếu giá mua đầu vào (MISSING RATE). Vui lòng tra cứu giá mua trước.");
      return;
    }

    startTransition(async () => {
      const targetId = savedQuotationId || "mock-quote-uuid";
      const res = await submitQuotationAction(targetId);
      if (res.success) {
        setIsImmutableLocked(true);
        setActionMessage({
          type: "success",
          text: res.message || "Báo giá đã được KHÓA BẤT BIẾN (Immutable Lock) và gửi Hội đồng Định giá phê duyệt.",
        });
      } else {
        setActionMessage({ type: "error", text: res.error || "Lỗi khi trình duyệt" });
      }
    });
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(num)) + " đ";
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              Không Gian Lập Báo Giá & Tra Cứu Giá Mua (Quotation Workspace)
            </h1>
            {savedQuotationNo && (
              <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                {savedQuotationNo}
              </span>
            )}
            {isImmutableLocked && (
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                KHÓA BẤT BIẾN (IMMUTABLE)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quy chuẩn P0 & P1: Tra cứu đa Nhà cung cấp, snapshot giá vốn, cấu thành giá bán SELL và kiểm soát biên lợi nhuận GP thời gian thực.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={isPending || isImmutableLocked}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-400" />
            Lưu Nháp (Draft)
          </button>
          <button
            onClick={handleSubmitForApproval}
            disabled={isPending || isImmutableLocked}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Trình Duyệt & Khóa Giá
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-lg border text-sm flex items-center gap-3 ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 25% / 75% SPLIT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: 25% (lg:col-span-3 or 4) - Header & Order Service Items */}
        {/* ==================================================================== */}
        <div className="lg:col-span-4 space-y-5">
          {/* Box 1: Thông tin thương mại */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                Khách Hàng & Phân Vùng
              </span>
              <span className="text-[10px] text-slate-500 font-mono">STEP 01</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Khách Hàng Mục Tiêu *</label>
                <select
                  disabled={isImmutableLocked}
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Phân Vùng Vận Hành (Region Scope) *</label>
                <select
                  disabled={isImmutableLocked}
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Mặt Hàng Vận Chuyển</label>
                <select
                  disabled={isImmutableLocked}
                  value={commodityId}
                  onChange={(e) => setCommodityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {commodities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Hạn Nợ Thương Mại</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    disabled={isImmutableLocked}
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-400 shrink-0">ngày</span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Danh sách gói dịch vụ (ORDER_SERVICE_ITEMS) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Gói Dịch Vụ Mua (Service Items)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isImmutableLocked}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Dịch Vụ
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Quy tắc P0.2: Khách hàng chỉ trả tiền theo danh mục dịch vụ chọn tại đây; lộ trình xe chạy qua Cảng không tự phát sinh phí bán SELL.
            </p>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItemIndex(idx)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    activeItemIndex === idx
                      ? "bg-blue-600/10 border-blue-500/40 shadow-sm"
                      : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">
                      #{idx + 1}. {item.servicePackage === "TRUCKING" ? "Vận tải Đường bộ" : item.servicePackage}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-400">
                        {item.plannedQuantity} {item.unit}
                      </span>
                      {items.length > 1 && !isImmutableLocked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(idx);
                          }}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <span>{locations.find((l) => l.id === item.originLocationId)?.code || "CHL"}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{locations.find((l) => l.id === item.destinationLocationId)?.code || "TIS"}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-blue-400">{item.equipmentType}</span>
                  </div>

                  {/* Trạng thái BUY Status */}
                  <div className="mt-2 flex items-center justify-between text-[11px]">
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
        {/* RIGHT COLUMN: 75% (lg:col-span-8) - BUY Rate Lookup, SELL & P&L */}
        {/* ==================================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Tuyến & Tra cứu giá mua đầu vào (BUY Rate Engine) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wide">
                  Chi Tiết Dịch Vụ #{activeItemIndex + 1} & Tra Cứu Giá Mua (BUY Engine)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Gói: <strong className="text-blue-400">{currentItem.servicePackage}</strong>
              </span>
            </div>

            {/* Các trường cấu hình tuyến vận chuyển */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Điểm Nhận / Xếp Hàng *</label>
                <select
                  disabled={isImmutableLocked}
                  value={currentItem.originLocationId}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, idx) => (idx === activeItemIndex ? { ...it, originLocationId: e.target.value } : it))
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Điểm Giao / Dỡ Hàng *</label>
                <select
                  disabled={isImmutableLocked}
                  value={currentItem.destinationLocationId}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, idx) =>
                        idx === activeItemIndex ? { ...it, destinationLocationId: e.target.value } : it
                      )
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Loại Container / Thiết Bị *</label>
                <select
                  disabled={isImmutableLocked}
                  value={currentItem.equipmentType}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, idx) => (idx === activeItemIndex ? { ...it, equipmentType: e.target.value } : it))
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {equipmentTypes.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Số lượng kế hoạch & Nút kích hoạt tra cứu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Số lượng chuyến dự kiến:</span>
                <input
                  type="number"
                  min="1"
                  disabled={isImmutableLocked}
                  value={currentItem.plannedQuantity}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, idx) =>
                        idx === activeItemIndex ? { ...it, plannedQuantity: Math.max(1, Number(e.target.value)) } : it
                      )
                    )
                  }
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono text-center focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-400">{currentItem.unit}</span>
              </div>

              <button
                type="button"
                onClick={() => handleLookupRate(activeItemIndex)}
                disabled={isPending || isImmutableLocked}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                Truy Vấn Giá Mua (Rate Lookup)
              </button>
            </div>

            {/* KẾT QUẢ TRA CỨU GIÁ MUA ĐẦU VÀO (THEO QUY TẮC P0.1) */}
            {currentItem.lookupResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">Kết Quả Tra Cứu:</span>
                    {currentItem.lookupResult.status === "MULTIPLE_CANDIDATES" && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold text-xs border border-blue-500/30">
                        {currentItem.lookupResult.candidates.length} Nhà cung cấp hợp lệ (Không conflict)
                      </span>
                    )}
                    {currentItem.lookupResult.status === "APPLY" && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold text-xs border border-emerald-500/30">
                        Áp Dụng Tự Động (01 Nhà cung cấp)
                      </span>
                    )}
                    {currentItem.lookupResult.status === "CONFLICT_RATE" && (
                      <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold text-xs border border-red-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Xung Đột Khoảng Ngày (Cùng NCC)
                      </span>
                    )}
                    {currentItem.lookupResult.status === "MISSING_RATE" && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold text-xs border border-amber-500/30">
                        Thiếu Giá Mua Đầu Vào (MISSING RATE)
                      </span>
                    )}
                  </div>

                  {currentItem.worstCaseBuyPrice > 0 && (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Worst-case BUY (Bảo thủ): </span>
                      <strong className="text-xs font-mono text-amber-400">
                        {formatVND(currentItem.worstCaseBuyPrice)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Bảng danh sách ứng viên BUY */}
                {currentItem.lookupResult.candidates.length > 0 && (
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Lựa Chọn</th>
                          <th className="py-2 px-3">Nhà Cung Cấp</th>
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
                              onClick={() => !isImmutableLocked && handleSelectCandidate(activeItemIndex, cand)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? "bg-blue-600/15 text-white" : "hover:bg-slate-900/50 text-slate-300"
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                <input
                                  type="radio"
                                  name={`candidate-${currentItem.id}`}
                                  checked={isSelected}
                                  onChange={() => {}}
                                  disabled={isImmutableLocked}
                                  className="text-blue-500 focus:ring-0"
                                />
                              </td>
                              <td className="py-2.5 px-3 font-medium">
                                {cand.vendorName}
                                {cand.vendorId === "VEND_TRUCK_THILOGI" && (
                                  <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                                    Đội xe nội bộ
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                {cand.validityRange}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                                {formatVND(cand.buyRate)}
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

          {/* Card 2: Cấu Thành Giá Bán (SELL) & Ma Trận Tài Chính P&L (Realtime Decimal.js) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-sm text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                Cấu Thành Giá Bán (SELL) & Hiệu Quả Kinh Doanh (P&L Matrix)
              </span>
              <span className="text-xs text-slate-400">Đơn vị tiền tệ: <strong>VND</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Đơn Giá Bán Đề Xuất (SELL / {currentItem.unit}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100000"
                    disabled={isImmutableLocked}
                    value={currentItem.unitSellPrice}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((it, idx) =>
                          idx === activeItemIndex ? { ...it, unitSellPrice: Number(e.target.value) } : it
                        )
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500">VND</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tổng Giá Bán Dòng Này (SELL Total)</label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-blue-400">
                  {formatVND((currentItem.unitSellPrice || 0) * (currentItem.plannedQuantity || 1))}
                </div>
              </div>
            </div>

            {/* LIVE KPI METRICS CỦA TOÀN BỘ BÁO GIÁ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Tổng Doanh Thu (SELL)</span>
                <span className="text-base sm:text-lg font-black font-mono text-white block mt-0.5">
                  {formatVND(totalSell)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Tổng Giá Vốn (BUY)</span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-400 block mt-0.5">
                  {formatVND(totalBuy)}
                </span>
                {totalWorstBuy > 0 && (
                  <span className="text-[10px] text-slate-500 font-mono block">Worst: {formatVND(totalWorstBuy)}</span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Lợi Nhuận Gộp (GP)</span>
                <span
                  className={`text-base sm:text-lg font-black font-mono block mt-0.5 ${
                    grossProfit >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatVND(grossProfit)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Biên Lợi Nhuận (Margin)</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-base sm:text-lg font-black font-mono ${
                      marginPercent >= 15
                        ? "text-emerald-400"
                        : marginPercent >= 5
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {marginPercent.toFixed(1)}%
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      marginPercent >= 15
                        ? "bg-emerald-500/20 text-emerald-300"
                        : marginPercent >= 5
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {marginPercent >= 15 ? "Đạt Chuẩn" : marginPercent >= 5 ? "Cần Duyệt" : "Dưới Sàn"}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông báo điều kiện thẩm định */}
            <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs text-blue-300/90 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Chính sách Margin THILOGI:</strong> Đơn hàng có Margin $\ge 15\%$ được phê duyệt nhanh bởi Trưởng bộ phận Pricing. Margin từ $5\% - 15\%$ yêu cầu thẩm định Phó Giám Đốc. Dưới $5\%$ chỉ được duyệt khi có chủ trương bù tải của Ban Lãnh Đạo.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
