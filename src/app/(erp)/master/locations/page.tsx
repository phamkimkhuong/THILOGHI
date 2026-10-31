"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader, RefreshButton, TableFeedback, Pagination, usePagination, useListFeedback } from "@/components/ui/list-page";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
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

  const { loading, error: loadError, runLoad } = useListFeedback();

  const loadData = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const res = await getLocationsAction();
      if (!res.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      if (res.success) {
        setLocations((res.locations || []) as LocationRecord[]);
        setRegions((res.regions || []) as RegionRecord[]);
      }
    });
  }, [runLoad]);

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

  const pagination = usePagination(filteredLocations.length, JSON.stringify([searchTerm, regionFilter, typeFilter]));

  return (
    <div className="space-y-4 font-sans text-slate-200">
      <PageHeader title="Địa điểm" actions={<><RefreshButton onClick={loadData} loading={loading} /></>} />

      {/* Multi-Filter Bar */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Instant Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên địa điểm, mã cảng, tỉnh thành..." aria-label="Tìm theo tên địa điểm, mã cảng, tỉnh thành..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Location Type Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
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
          <span className="text-xs text-slate-500">Phân vùng:</span>
           <select aria-label="Phân vùng" value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả phân vùng</option>
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
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
          <table className="erp-table w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Mã địa điểm</th>
                <th className="py-2.5 px-3">Tên địa điểm</th>
                <th className="py-2.5 px-3">Phân loại</th>
                <th className="py-2.5 px-3">Phân vùng</th>
                <th className="py-2.5 px-3">Địa chỉ</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading || loadError ? <TableFeedback columns={7} loading={loading} error={loadError} onRetry={loadData} /> : filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không tìm thấy địa điểm phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredLocations.slice(pagination.start, pagination.end).map((l) => (
                  <tr key={l.locationId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 text-xs whitespace-nowrap">
                      {l.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-100 flex items-center gap-1.5">
                      {getTypeIcon(l.locationType)}
                      <span className="font-semibold text-slate-200">{l.name}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-xs px-1.5 py-0.2 rounded bg-slate-800 font-mono text-slate-300">
                        {l.locationType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs font-mono whitespace-nowrap">
                      {l.regionName || l.regionId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs max-w-[260px] truncate" title={l.address}>
                      {l.address || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={l.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/quotations/new?origin=${l.locationId}`}
                        className="px-2 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors"
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
        <Pagination pagination={pagination} loading={loading} error={!!loadError} loaded={locations.length} limit={250} />
      </div>
    </div>
  );
}
