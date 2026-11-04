"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader, RefreshButton, TableFeedback, Pagination, usePagination, useListFeedback } from "@/components/ui/list-page";
import { EmptyState } from "@/components/ui/empty-state";

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

  const { loading, error: loadError, runLoad } = useListFeedback("locations_list");

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
        return <MapPin className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const pagination = usePagination(filteredLocations.length, JSON.stringify([searchTerm, regionFilter, typeFilter]));

  return (
    <div className="space-y-4 font-sans text-foreground">
      <PageHeader title="Địa điểm" actions={<><Link href="/master/manage" className="erp-button">Quản lý dữ liệu</Link><RefreshButton onClick={loadData} loading={loading} /></>} />

      {/* Multi-Filter Bar */}
      <div className="p-2.5 rounded-xl bg-surface border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shadow-xs">
        {/* Instant Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên địa điểm, mã cảng, tỉnh thành..." aria-label="Tìm theo tên địa điểm, mã cảng, tỉnh thành..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Location Type Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Loại hình:
          </span>
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === "ALL"
                ? "bg-blue-600 text-white font-bold"
                : "bg-background text-muted-foreground hover:text-foreground border border-border"
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
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {type} ({count})
            </button>
          ))}
        </div>

        {/* Region Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-xs text-muted-foreground">Phân vùng:</span>
           <select aria-label="Phân vùng" value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
          <table className="erp-table w-full text-left text-xs text-foreground">
            <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
            <tbody className="divide-y divide-border/60 font-sans">
              {loading || loadError ? <TableFeedback columns={7} loading={loading} error={loadError} onRetry={loadData} /> : filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={MapPin}
                      title="Không tìm thấy địa điểm phù hợp"
                      description="Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc lại theo loại địa điểm / phân vùng."
                    />
                  </td>
                </tr>
              ) : (
                filteredLocations.slice(pagination.start, pagination.end).map((l) => (
                  <tr key={l.locationId} className="hover:bg-surface-hover transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-cyan-400 text-xs whitespace-nowrap">
                      {l.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-1.5">
                      {getTypeIcon(l.locationType)}
                      <span className="font-semibold text-foreground">{l.name}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-muted-foreground">
                        {l.locationType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs font-mono whitespace-nowrap">
                      {l.regionName || l.regionId}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs max-w-[260px] truncate" title={l.address}>
                      {l.address || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={l.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/quotations/new?origin=${l.locationId}`}
                        className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-600/15 dark:hover:bg-blue-600/25 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors"
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
