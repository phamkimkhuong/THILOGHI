"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Filter,
  ArrowRight,
  Anchor,
  Layers,
  Warehouse,
  Factory,
} from "lucide-react";
import { getLocationsAction } from "@/features/master-data/actions";

interface LocationRecord {
  locationId: string;
  code: string;
  name: string;
  locationType: string;
  regionId: string;
  regionName: string;
  address?: string;
  isActive: boolean;
}

interface RegionRecord {
  id: string;
  name: string;
  code?: string;
}

export default function MasterLocationsPage() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [regions, setRegions] = useState<RegionRecord[]>([]);
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(() => {
    startTransition(async () => {
      const res = await getLocationsAction();
      if (res.success) {
        setLocations((res.locations || []) as LocationRecord[]);
        setRegions((res.regions || []) as RegionRecord[]);
      }
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique Location Types for chips
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    locations.forEach((l) => {
      counts[l.locationType] = (counts[l.locationType] || 0) + 1;
    });
    return counts;
  }, [locations]);

  // Instant Client-side Search & Filter
  const filteredLocations = useMemo(() => {
    let list = [...locations];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q) ||
          (l.address && l.address.toLowerCase().includes(q)) ||
          (l.regionName && l.regionName.toLowerCase().includes(q))
      );
    }

    if (regionFilter !== "ALL") {
      list = list.filter((l) => l.regionId === regionFilter);
    }

    if (typeFilter !== "ALL") {
      list = list.filter((l) => l.locationType === typeFilter);
    }

    return list;
  }, [locations, searchTerm, regionFilter, typeFilter]);

  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PORT":
        return <Anchor className="w-3.5 h-3.5 text-blue-400" />;
      case "BORDER_GATE":
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
      case "WAREHOUSE":
      case "DEPOT":
      case "ICD":
        return <Warehouse className="w-3.5 h-3.5 text-emerald-400" />;
      case "INDUSTRIAL_ZONE":
        return <Factory className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              LOGISTICS NODES & NETWORK
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Hiển thị: <strong>{filteredLocations.length}</strong> / {locations.length} điểm đến
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-cyan-400" />
            Mạng Lưới Địa Điểm, Cảng Biển & Cửa Khẩu
          </h1>
          <p className="text-xs text-slate-400">
            Hệ thống cảng Chu Lai, Tiên Sa, Quy Nhơn, ICD, kho bãi và các cửa khẩu Bờ Y, Nam Giang, Lao Bảo
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Multi-Filter Bar */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Instant Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên địa điểm, mã cảng, tỉnh thành..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Location Type Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Loại hình:
          </span>
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === "ALL"
                ? "bg-blue-600 text-white font-bold"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Tất cả ({locations.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                typeFilter === type
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {type} ({count})
            </button>
          ))}
        </div>

        {/* Region Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-[11px] text-slate-500">Phân vùng:</span>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất Cả Phân Vùng</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Mã Code</th>
                <th className="py-2.5 px-3">Tên Địa Điểm / Cảng / Kho</th>
                <th className="py-2.5 px-3">Phân Loại</th>
                <th className="py-2.5 px-3">Phân Vùng Vận Hành</th>
                <th className="py-2.5 px-3">Địa Chỉ / Tỉnh Thành</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không tìm thấy địa điểm phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((l) => (
                  <tr key={l.locationId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 text-[11px] whitespace-nowrap">
                      {l.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-100 flex items-center gap-1.5">
                      {getTypeIcon(l.locationType)}
                      <span className="font-semibold text-slate-200">{l.name}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-slate-300">
                        {l.locationType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {l.regionName || l.regionId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-[260px] truncate" title={l.address}>
                      {l.address || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Hoạt động
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/quotations/new?origin=${l.locationId}`}
                        className="px-2 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        Lập Tuyến Từ Đây <ArrowRight className="w-3 h-3" />
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
