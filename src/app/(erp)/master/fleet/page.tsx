"use client";

import { PageHeader, RefreshButton, TableFeedback, Pagination, usePagination, useListFeedback } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  User,
  Search,
  Filter,
  Phone,
  FileCheck,
  Truck,
} from "lucide-react";
import { getFleetAction } from "@/features/master-data/actions";

interface TractorRecord {
  tractorId: string;
  plateNumber: string;
  model?: string;
  status: string;
  ownership: string;
}

interface TrailerRecord {
  trailerId: string;
  plateNumber: string;
  trailerType: string;
  payloadCapacityKg?: number;
  status: string;
}

interface DriverRecord {
  driverId: string;
  fullName: string;
  phone?: string;
  licenseNumber?: string;
  status: string;
}

export default function MasterFleetPage() {
  const [activeTab, setActiveTab] = useState<"TRACTORS" | "TRAILERS" | "DRIVERS">("TRACTORS");
  const [tractors, setTractors] = useState<TractorRecord[]>([]);
  const [trailers, setTrailers] = useState<TrailerRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [subFilter, setSubFilter] = useState("ALL");



  const { loading, error: loadError, runLoad } = useListFeedback("fleet_list");

  const loadData = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const res = await getFleetAction(1000);
      if (!res.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      if (res.success && res.fleet) {
        setTractors((res.fleet.tractors || []) as TractorRecord[]);
        setTrailers((res.fleet.trailers || []) as TrailerRecord[]);
        setDrivers((res.fleet.drivers || []) as DriverRecord[]);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab: "TRACTORS" | "TRAILERS" | "DRIVERS") => {
    setActiveTab(tab);
    setSubFilter("ALL");
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
  };

  const handleSubFilterChange = (filter: string) => {
    setSubFilter(filter);
  };

  // Tractors filter
  const filteredTractors = useMemo(() => {
    let list = [...tractors];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.plateNumber.toLowerCase().includes(q) ||
          t.tractorId.toLowerCase().includes(q) ||
          (t.model && t.model.toLowerCase().includes(q))
      );
    }
    if (subFilter !== "ALL") {
      list = list.filter((t) => t.ownership === subFilter);
    }
    return list;
  }, [tractors, searchTerm, subFilter]);

  // Trailers filter
  const filteredTrailers = useMemo(() => {
    let list = [...trailers];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (tr) =>
          tr.plateNumber.toLowerCase().includes(q) ||
          tr.trailerId.toLowerCase().includes(q) ||
          tr.trailerType.toLowerCase().includes(q)
      );
    }
    if (subFilter !== "ALL") {
      list = list.filter((tr) => tr.trailerType === subFilter);
    }
    return list;
  }, [trailers, searchTerm, subFilter]);

  // Drivers filter
  const filteredDrivers = useMemo(() => {
    let list = [...drivers];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.driverId.toLowerCase().includes(q) ||
          (d.phone && d.phone.toLowerCase().includes(q)) ||
          (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q))
      );
    }
    return list;
  }, [drivers, searchTerm]);

  // Current list based on active tab
  const activeListLength = useMemo(() => {
    if (activeTab === "TRACTORS") return filteredTractors.length;
    if (activeTab === "TRAILERS") return filteredTrailers.length;
    return filteredDrivers.length;
  }, [activeTab, filteredTractors, filteredTrailers, filteredDrivers]);

  const pagination = usePagination(activeListLength, JSON.stringify([activeTab, searchTerm, subFilter]));
  const paginatedTractors = filteredTractors.slice(pagination.start, pagination.end);
  const paginatedTrailers = filteredTrailers.slice(pagination.start, pagination.end);
  const paginatedDrivers = filteredDrivers.slice(pagination.start, pagination.end);

  // Trailer types unique list
  const uniqueTrailerTypes = useMemo(() => {
    const set = new Set<string>();
    trailers.forEach((tr) => set.add(tr.trailerType));
    return Array.from(set);
  }, [trailers]);

  // Ownership unique list
  const uniqueOwnerships = useMemo(() => {
    const set = new Set<string>();
    tractors.forEach((t) => set.add(t.ownership));
    return Array.from(set);
  }, [tractors]);

  return (
    <div className="space-y-4 font-sans text-foreground">
      <PageHeader title="Đội xe" actions={<><RefreshButton onClick={loadData} loading={loading} /></>} />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Loại danh mục đội xe">
        {([{ id: "TRACTORS", label: "Đầu kéo" }, { id: "TRAILERS", label: "Rơ-moóc" }, { id: "DRIVERS", label: "Tài xế" }] as const).map(tab => <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} onClick={() => handleTabChange(tab.id)} className={activeTab === tab.id ? "erp-button bg-blue-600 text-white font-bold" : "erp-button border border-border text-foreground bg-surface hover:bg-surface-hover"}>{tab.label}</button>)}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2.5 rounded-xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={
              activeTab === "TRACTORS"
                ? "Tìm theo biển số, mã đầu kéo, model..."
                : activeTab === "TRAILERS"
                ? "Tìm theo biển số moóc, chủng loại..."
                : "Tìm theo họ tên, số điện thoại, GPLX..."
            }
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Sub-filter chips */}
        {activeTab === "TRACTORS" && uniqueOwnerships.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Sở hữu:
            </span>
            <button
              onClick={() => handleSubFilterChange("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                subFilter === "ALL"
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Tất cả
            </button>
            {uniqueOwnerships.map((own) => (
              <button
                key={own}
                onClick={() => handleSubFilterChange(own)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  subFilter === own
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-background text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {own}
              </button>
            ))}
          </div>
        )}

        {activeTab === "TRAILERS" && uniqueTrailerTypes.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
            <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Loại:
            </span>
            <button
              onClick={() => handleSubFilterChange("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                subFilter === "ALL"
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Tất cả
            </button>
            {uniqueTrailerTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleSubFilterChange(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  subFilter === type
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-background text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Main Table Content */}
      {activeTab === "TRACTORS" && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
            <table className="erp-table w-full text-left text-xs text-foreground">
              <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã đầu kéo</th>
                  <th className="py-2.5 px-3">Biển số</th>
                  <th className="py-2.5 px-3">Model / Nhãn Hiệu</th>
                  <th className="py-2.5 px-3">Hình Thức Sở Hữu</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái Vận Hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {loading || loadError ? <TableFeedback columns={6} loading={loading} error={loadError} onRetry={loadData} /> : paginatedTractors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <EmptyState
                        icon={Truck}
                        title="Không tìm thấy đầu kéo phù hợp"
                        description="Hãy thử thay đổi từ khóa tìm kiếm biển số hoặc tình trạng bảo dưỡng."
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedTractors.map((t, idx) => (
                    <tr key={t.tractorId} className="hover:bg-surface-hover transition-colors">
                      <td className="py-2.5 px-3 font-mono text-muted-foreground text-xs w-12">
                        {pagination.start + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground text-xs">
                        {t.tractorId}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-cyan-400 text-sm">
                        {t.plateNumber}
                      </td>
                      <td className="py-2.5 px-3 text-foreground">
                        {t.model || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-surface font-mono text-foreground border border-border">
                          {t.ownership}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "TRAILERS" && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
            <table className="erp-table w-full text-left text-xs text-foreground">
              <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã rơ-moóc</th>
                  <th className="py-2.5 px-3">Biển số</th>
                  <th className="py-2.5 px-3">Loại rơ-moóc</th>
                  <th className="py-2.5 px-3 text-right">Tải trọng</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {loading || loadError ? <TableFeedback columns={6} loading={loading} error={loadError} onRetry={loadData} /> : paginatedTrailers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <EmptyState
                        icon={Truck}
                        title="Không tìm thấy rơ-moóc phù hợp"
                        description="Hãy thử thay đổi từ khóa tìm kiếm biển số hoặc loại rơ-moóc chuyên dụng."
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedTrailers.map((tr, idx) => (
                    <tr key={tr.trailerId} className="hover:bg-surface-hover transition-colors">
                      <td className="py-2.5 px-3 font-mono text-muted-foreground text-xs w-12">
                        {pagination.start + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground text-xs">
                        {tr.trailerId}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-cyan-400 text-sm">
                        {tr.plateNumber}
                      </td>
                      <td className="py-2.5 px-3 text-foreground font-semibold">
                        {tr.trailerType}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-foreground">
                        {tr.payloadCapacityKg != null ? new Intl.NumberFormat("vi-VN").format(tr.payloadCapacityKg) + " kg" : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={tr.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "DRIVERS" && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
            <table className="erp-table w-full text-left text-xs text-foreground">
              <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã tài xế</th>
                  <th className="py-2.5 px-3">Tên tài xế</th>
                  <th className="py-2.5 px-3">Điện thoại</th>
                  <th className="py-2.5 px-3 font-mono">Số giấy phép lái xe</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {loading || loadError ? <TableFeedback columns={6} loading={loading} error={loadError} onRetry={loadData} /> : paginatedDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <EmptyState
                        icon={User}
                        title="Không tìm thấy tài xế phù hợp"
                        description="Hãy thử thay đổi từ khóa tìm kiếm tên, số điện thoại hoặc giấy phép lái xe."
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedDrivers.map((d, idx) => (
                    <tr key={d.driverId} className="hover:bg-surface-hover transition-colors">
                      <td className="py-2.5 px-3 font-mono text-muted-foreground text-xs w-12">
                        {pagination.start + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground text-xs">
                        {d.driverId}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{d.fullName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-foreground">
                        {d.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{d.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-cyan-400">
                        <div className="flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>{d.licenseNumber || "—"}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={d.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination pagination={pagination} loading={loading} error={!!loadError} loaded={activeTab === "TRACTORS" ? tractors.length : activeTab === "TRAILERS" ? trailers.length : drivers.length} limit={1000} />
    </div>
  );
}
