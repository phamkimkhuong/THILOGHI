"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Filter,
  TrendingDown,
  Building2,
  Navigation,
} from "lucide-react";
import { getRoadRatesAction } from "@/features/master-data/actions";

interface RoadRateItem {
  rateId: string;
  vendorId: string;
  vendorName: string;
  pickupLocationId: string;
  pickupName: string;
  pickupCode: string;
  deliveryLocationId: string;
  deliveryName: string;
  deliveryCode: string;
  equipmentType: string;
  buyRate: number;
  currency: string;
  validFrom: string;
  validTo: string;
  status: string;
  remarks?: string;
}

export default function RoadRatesLibraryPage() {
  const [rates, setRates] = useState<RoadRateItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("ALL");
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "route">("price_asc");

  // Quick Route Matcher State
  const [matcherOrigin, setMatcherOrigin] = useState("ALL");
  const [matcherDest, setMatcherDest] = useState("ALL");
  const [matcherEquipment, setMatcherEquipment] = useState("ALL");

  const [isPending, startTransition] = useTransition();

  const loadRates = useCallback(() => {
    startTransition(async () => {
      const res = await getRoadRatesAction();
      if (res.success && res.data) {
        setRates(res.data as RoadRateItem[]);
      }
    });
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Unique lists for quick route matcher
  const uniqueOrigins = useMemo(() => {
    const map = new Map<string, string>();
    rates.forEach((r) => map.set(r.pickupLocationId, `${r.pickupName} (${r.pickupCode})`));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rates]);

  const uniqueDestinations = useMemo(() => {
    const map = new Map<string, string>();
    rates.forEach((r) => map.set(r.deliveryLocationId, `${r.deliveryName} (${r.deliveryCode})`));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rates]);

  const uniqueEquipments = useMemo(() => {
    const set = new Set<string>();
    rates.forEach((r) => set.add(r.equipmentType));
    return Array.from(set);
  }, [rates]);

  // Instant Client-Side Filter (Siêu tốc, phản hồi ngay lập tức khi gõ phím)
  const filteredRates = useMemo(() => {
    let list = [...rates];

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.vendorName.toLowerCase().includes(q) ||
          r.pickupName.toLowerCase().includes(q) ||
          r.deliveryName.toLowerCase().includes(q) ||
          r.pickupCode.toLowerCase().includes(q) ||
          r.deliveryCode.toLowerCase().includes(q) ||
          r.equipmentType.toLowerCase().includes(q)
      );
    }

    // Equipment filter
    if (selectedEquipment !== "ALL") {
      list = list.filter((r) => r.equipmentType === selectedEquipment);
    }

    // Quick Matcher filters
    if (matcherOrigin !== "ALL") {
      list = list.filter((r) => r.pickupLocationId === matcherOrigin);
    }
    if (matcherDest !== "ALL") {
      list = list.filter((r) => r.deliveryLocationId === matcherDest);
    }
    if (matcherEquipment !== "ALL") {
      list = list.filter((r) => r.equipmentType === matcherEquipment);
    }

    // Sort
    if (sortBy === "price_asc") {
      list.sort((a, b) => a.buyRate - b.buyRate);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.buyRate - a.buyRate);
    } else if (sortBy === "route") {
      list.sort((a, b) => a.pickupName.localeCompare(b.pickupName));
    }

    return list;
  }, [rates, searchTerm, selectedEquipment, matcherOrigin, matcherDest, matcherEquipment, sortBy]);

  // Summary Metrics
  const minPrice = useMemo(() => {
    if (filteredRates.length === 0) return 0;
    return Math.min(...filteredRates.map((r) => r.buyRate));
  }, [filteredRates]);

  const maxPrice = useMemo(() => {
    if (filteredRates.length === 0) return 0;
    return Math.max(...filteredRates.map((r) => r.buyRate));
  }, [filteredRates]);

  const avgPrice = useMemo(() => {
    if (filteredRates.length === 0) return 0;
    const sum = filteredRates.reduce((acc, r) => acc + r.buyRate, 0);
    return Math.round(sum / filteredRates.length);
  }, [filteredRates]);

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ROAD TRANSPORT RATES HUB
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Hiển thị: <strong>{filteredRates.length}</strong> / {rates.length} tuyến cước
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-emerald-400" />
            Tra Cứu Bảng Giá Mua Cước Đường Bộ (Road Rates)
          </h1>
          <p className="text-xs text-slate-400">
            Thư viện 130 bảng giá mua cước thực tế từ các nhà xe đối tác THILOGI, phục vụ BUY Rate Lookup và thẩm định P&L
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRates}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <Link
            href="/quotations/new"
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Lập Báo Giá
          </Link>
        </div>
      </div>

      {/* QUICK ROUTE MATCHER BOX (Tra Cứu Tuyến Tức Thời) */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            Công Cụ Định Tuyến Nhanh (Quick Route Matcher)
          </span>
          {(matcherOrigin !== "ALL" || matcherDest !== "ALL" || matcherEquipment !== "ALL") && (
            <button
              onClick={() => {
                setMatcherOrigin("ALL");
                setMatcherDest("ALL");
                setMatcherEquipment("ALL");
              }}
              className="text-[11px] text-blue-400 hover:underline font-medium"
            >
              Đặt lại bộ lọc tuyến
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Điểm Nhận / Xếp Hàng (Origin)</label>
            <select
              value={matcherOrigin}
              onChange={(e) => setMatcherOrigin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">-- Tất Cả Điểm Đi ({uniqueOrigins.length}) --</option>
              {uniqueOrigins.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Điểm Giao / Dỡ Hàng (Destination)</label>
            <select
              value={matcherDest}
              onChange={(e) => setMatcherDest(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">-- Tất Cả Điểm Đến ({uniqueDestinations.length}) --</option>
              {uniqueDestinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Loại Thiết Bị / Cont</label>
            <select
              value={matcherEquipment}
              onChange={(e) => setMatcherEquipment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">-- Tất Cả Loại Thiết Bị --</option>
              {uniqueEquipments.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI & Stat Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">Tuyến Phù Hợp</span>
          <span className="text-xl font-black font-mono text-white mt-0.5">{filteredRates.length}</span>
          <span className="text-[10px] text-slate-500 font-mono">Dữ liệu thực tế</span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-emerald-400">Giá Mua Tối Thiểu (Best BUY)</span>
          <span className="text-xl font-black font-mono text-emerald-300 mt-0.5">
            {filteredRates.length > 0 ? formatVND(minPrice) : "0 đ"}
          </span>
          <span className="text-[10px] text-emerald-400/70 font-mono">Ưu thế chi phí nhất</span>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-amber-400">Worst-Case BUY (Cao Nhất)</span>
          <span className="text-xl font-black font-mono text-amber-300 mt-0.5">
            {filteredRates.length > 0 ? formatVND(maxPrice) : "0 đ"}
          </span>
          <span className="text-[10px] text-amber-400/70 font-mono">Mức bảo thủ tính P&L</span>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col justify-between">
          <span className="text-[11px] text-blue-400">Đơn Giá Trung Bình Tuyến</span>
          <span className="text-xl font-black font-mono text-blue-300 mt-0.5">
            {filteredRates.length > 0 ? formatVND(avgPrice) : "0 đ"}
          </span>
          <span className="text-[10px] text-blue-400/70 font-mono">Giá bình quân các nhà xe</span>
        </div>
      </div>

      {/* Multi-Filter Bar: Search, Equipment Chips, Sort */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Instant Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo nhà xe, điểm xếp, điểm dỡ, mã cảng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Equipment Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Thiết bị:
          </span>
          {["ALL", "40HC", "RMS", "20DC", "40RH", "TRUCK_15T", "General"].map((eq) => (
            <button
              key={eq}
              onClick={() => setSelectedEquipment(eq)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors ${
                selectedEquipment === eq
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {eq === "ALL" ? "Tất cả" : eq}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-[11px] text-slate-500">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "price_asc" | "price_desc" | "route")}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="price_asc">Giá mua tăng dần (Rẻ nhất trước)</option>
            <option value="price_desc">Giá mua giảm dần</option>
            <option value="route">Tuyến đường (A &rarr; Z)</option>
          </select>
        </div>
      </div>

      {/* Main Rates Data Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">STT</th>
                <th className="py-2.5 px-3">Nhà Cung Cấp / Đơn Vị</th>
                <th className="py-2.5 px-3">Điểm Xếp Hàng (Origin)</th>
                <th className="py-2.5 px-3">Điểm Dỡ Hàng (Destination)</th>
                <th className="py-2.5 px-3 text-center">Loại Thiết Bị</th>
                <th className="py-2.5 px-3 text-right">Đơn Giá Mua (BUY)</th>
                <th className="py-2.5 px-3 text-center">Hiệu Lực</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    {isPending ? "Đang truy vấn bảng giá từ CSDL..." : "Không tìm thấy bảng giá cước phù hợp với điều kiện lọc."}
                  </td>
                </tr>
              ) : (
                filteredRates.map((r, idx) => (
                  <tr key={r.rateId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] w-12">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-100 max-w-[200px] truncate" title={r.vendorName}>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{r.vendorName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-200">{r.pickupName}</div>
                      <div className="text-[10px] font-mono text-cyan-400">{r.pickupCode}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-200">{r.deliveryName}</div>
                      <div className="text-[10px] font-mono text-cyan-400">{r.deliveryCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {r.equipmentType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                      <div>{formatVND(r.buyRate)}</div>
                      {r.currency !== "VND" && (
                        <div className="text-[10px] text-slate-500 font-normal">
                          ({r.currency} quy đổi FX)
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {r.validFrom} &rarr; Hiện tại
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Đã duyệt
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/quotations/new?origin=${r.pickupLocationId}&dest=${r.deliveryLocationId}&eq=${r.equipmentType}`}
                        className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                        title="Tự động nạp tuyến và tra cứu giá mua này trên màn hình lập báo giá"
                      >
                        Báo Giá Tuyến Này <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
