"use client";

import { PageHeader, RefreshButton, TableFeedback, Pagination, usePagination, useListFeedback } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  PlusCircle,
  Filter,
  Building2,
  Navigation,
  FileSpreadsheet,
} from "lucide-react";
import { getRoadRatesAction } from "@/features/master-data/actions";
import { exportRoadRatesToExcel } from "@/shared/utils/excel";

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
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "route">("route");

  // Quick Route Matcher State
  const [matcherOrigin, setMatcherOrigin] = useState("ALL");
  const [matcherDest, setMatcherDest] = useState("ALL");
  const [matcherEquipment, setMatcherEquipment] = useState("ALL");


  const { loading, error: loadError, runLoad } = useListFeedback();

  const loadRates = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const res = await getRoadRatesAction();
      if (!res.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      if (res.success && res.data) {
        setRates(res.data as RoadRateItem[]);
      }
    });
  }, [runLoad]);

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
      list.sort((a, b) => a.currency.localeCompare(b.currency) || a.buyRate - b.buyRate);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => a.currency.localeCompare(b.currency) || b.buyRate - a.buyRate);
    } else if (sortBy === "route") {
      list.sort((a, b) => a.pickupName.localeCompare(b.pickupName));
    }

    return list;
  }, [rates, searchTerm, selectedEquipment, matcherOrigin, matcherDest, matcherEquipment, sortBy]);

  const pagination = usePagination(filteredRates.length, JSON.stringify([searchTerm, selectedEquipment, matcherOrigin, matcherDest, matcherEquipment, sortBy]));

  return (
    <div className="space-y-4 font-sans text-foreground">
      <PageHeader
        title="Giá mua đường bộ"
        actions={
          <>
            <Link href="/master/manage" className="erp-button">
              Quản lý dữ liệu
            </Link>
            <button
              type="button"
              className="erp-button border border-border bg-surface text-foreground hover:bg-surface-hover shadow-xs font-semibold inline-flex items-center gap-1.5"
              onClick={() => void exportRoadRatesToExcel(filteredRates)}
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Xuất Excel
            </button>
            <RefreshButton onClick={loadRates} loading={loading} />
            <Link href="/quotations/new" className="erp-button bg-primary text-white hover:bg-primary-hover font-bold inline-flex items-center gap-1.5 shadow-xs">
              <PlusCircle className="h-4 w-4" />
              Lập báo giá
            </Link>
          </>
        }
      />

      {/* QUICK ROUTE MATCHER BOX (Tra Cứu Tuyến Tức Thời) */}
      <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            Lọc tuyến
          </span>
          {(matcherOrigin !== "ALL" || matcherDest !== "ALL" || matcherEquipment !== "ALL") && (
            <button
              onClick={() => {
                setMatcherOrigin("ALL");
                setMatcherDest("ALL");
                setMatcherEquipment("ALL");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Đặt lại bộ lọc tuyến
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Điểm Nhận / Xếp Hàng (Origin)</label>
             <select aria-label="Điểm xếp" value={matcherOrigin}
              onChange={(e) => setMatcherOrigin(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
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
            <label className="text-xs text-muted-foreground block mb-1">Điểm Giao / Dỡ Hàng (Destination)</label>
             <select aria-label="Điểm dỡ" value={matcherDest}
              onChange={(e) => setMatcherDest(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
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
            <label className="text-xs text-muted-foreground block mb-1">Thiết bị / Cont</label>
             <select aria-label="Thiết bị" value={matcherEquipment}
              onChange={(e) => setMatcherEquipment(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">-- Tất Cả Thiết bị --</option>
              {uniqueEquipments.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Multi-Filter Bar: Search, Equipment Chips, Sort */}
      <div className="p-2.5 rounded-xl bg-surface border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shadow-xs">
        {/* Instant Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo nhà xe, điểm xếp, điểm dỡ, mã cảng..." aria-label="Tìm theo nhà xe, điểm xếp, điểm dỡ, mã cảng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Equipment Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Thiết bị:
          </span>
          {["ALL", ...uniqueEquipments].map((eq) => (
            <button
              key={eq}
              onClick={() => setSelectedEquipment(eq)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors ${
                selectedEquipment === eq
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "bg-background text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border"
              }`}
            >
              {eq === "ALL" ? "Tất cả" : eq}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-xs text-muted-foreground">Sắp xếp:</span>
           <select aria-label="Sắp xếp giá mua" value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "price_asc" | "price_desc" | "route")}
            className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="price_asc">Giá tăng trong từng loại tiền</option>
            <option value="price_desc">Giá giảm trong từng loại tiền</option>
            <option value="route">Tuyến đường (A &rarr; Z)</option>
          </select>
        </div>
      </div>

      {/* Main Rates Data Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
          <table className="erp-table w-full text-left text-xs text-foreground">
            <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3">STT</th>
                <th className="py-2.5 px-3">Nhà cung cấp</th>
                <th className="py-2.5 px-3">Điểm xếp</th>
                <th className="py-2.5 px-3">Điểm dỡ</th>
                <th className="py-2.5 px-3 text-center">Thiết bị</th>
                <th className="py-2.5 px-3 text-right">Đơn giá mua</th>
                <th className="py-2.5 px-3 text-center">Hiệu lực</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-sans">
              {loading || loadError ? <TableFeedback columns={9} loading={loading} error={loadError} onRetry={loadRates} /> : filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy bảng giá cước phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredRates.slice(pagination.start, pagination.end).map((r, idx) => (
                  <tr key={r.rateId} className="hover:bg-surface-hover transition-colors">
                    <td className="py-2.5 px-3 font-mono text-muted-foreground text-xs w-12">
                      {pagination.start + idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-foreground max-w-[200px] truncate" title={r.vendorName}>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{r.vendorName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-foreground">{r.pickupName}</div>
                      <div className="text-xs font-mono text-blue-600 dark:text-cyan-400">{r.pickupCode}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-foreground">{r.deliveryName}</div>
                      <div className="text-xs font-mono text-blue-600 dark:text-cyan-400">{r.deliveryCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600 dark:text-cyan-400">
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border">
                        {r.equipmentType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      <div>{new Intl.NumberFormat("vi-VN", { maximumFractionDigits: r.currency === "VND" ? 0 : 2 }).format(r.buyRate)} {r.currency}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-muted-foreground whitespace-nowrap">
                      <div>Từ {r.validFrom || "Không giới hạn"}</div><div>{r.validTo ? "Trước " + r.validTo : "Không thời hạn"}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/quotations/new?origin=${r.pickupLocationId}&dest=${r.deliveryLocationId}&eq=${r.equipmentType}`}
                        className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-600/15 dark:hover:bg-blue-600/25 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        title="Tự động nạp tuyến và tra cứu giá mua này trên màn hình lập báo giá"
                      >
                        Lập báo giá <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} loading={loading} error={!!loadError} loaded={rates.length} limit={250} />
      </div>
    </div>
  );
}
