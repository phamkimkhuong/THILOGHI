"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import {
  Truck,
  RefreshCw,
  User,
  ShieldCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Phone,
  FileCheck,
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(() => {
    startTransition(async () => {
      const res = await getFleetAction(1000);
      if (res.success && res.fleet) {
        setTractors((res.fleet.tractors || []) as TractorRecord[]);
        setTrailers((res.fleet.trailers || []) as TrailerRecord[]);
        setDrivers((res.fleet.drivers || []) as DriverRecord[]);
      }
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab: "TRACTORS" | "TRAILERS" | "DRIVERS") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSubFilter("ALL");
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleSubFilterChange = (filter: string) => {
    setSubFilter(filter);
    setCurrentPage(1);
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

  const totalPages = Math.max(1, Math.ceil(activeListLength / pageSize));

  const paginatedTractors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTractors.slice(start, start + pageSize);
  }, [filteredTractors, currentPage]);

  const paginatedTrailers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrailers.slice(start, start + pageSize);
  }, [filteredTrailers, currentPage]);

  const paginatedDrivers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDrivers.slice(start, start + pageSize);
  }, [filteredDrivers, currentPage]);

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
    <div className="space-y-4 font-sans text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              FLEET & EQUIPMENT DIRECTORY
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Tổng đội: <strong>{tractors.length}</strong> đầu kéo • <strong>{trailers.length}</strong> rơ-moóc • <strong>{drivers.length}</strong> tài xế
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-400" />
            Danh Mục Đội Xe & Phương Tiện Vận Tải
          </h1>
          <p className="text-xs text-slate-400">
            Quản trị phương tiện đầu kéo container, sơ-mi rơ-moóc sàn/lạnh và đội ngũ tài xế đường dài THILOGI
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

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div
          onClick={() => handleTabChange("TRACTORS")}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            activeTab === "TRACTORS"
              ? "bg-blue-600/15 border-blue-500/40 shadow-sm"
              : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Xe Đầu Kéo</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">{tractors.length}</div>
          <div className="text-[10px] text-slate-500 font-mono">THACO Foton Auman / Dongfeng</div>
        </div>

        <div
          onClick={() => handleTabChange("TRAILERS")}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            activeTab === "TRAILERS"
              ? "bg-blue-600/15 border-blue-500/40 shadow-sm"
              : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Sơ-mi Rơ-moóc</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-300 mt-1">{trailers.length}</div>
          <div className="text-[10px] text-slate-500 font-mono">Moóc sàn RMS, xương 40ft, moóc lạnh</div>
        </div>

        <div
          onClick={() => handleTabChange("DRIVERS")}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            activeTab === "DRIVERS"
              ? "bg-blue-600/15 border-blue-500/40 shadow-sm"
              : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Lái Xe Đường Dài</span>
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300 mt-1">{drivers.length}</div>
          <div className="text-[10px] text-slate-500 font-mono">100% GPLX hạng FC chuyên nghiệp</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
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
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Sub-filter chips */}
        {activeTab === "TRACTORS" && uniqueOwnerships.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Sở hữu:
            </span>
            <button
              onClick={() => handleSubFilterChange("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                subFilter === "ALL"
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
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
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {own}
              </button>
            ))}
          </div>
        )}

        {activeTab === "TRAILERS" && uniqueTrailerTypes.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Loại:
            </span>
            <button
              onClick={() => handleSubFilterChange("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                subFilter === "ALL"
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
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
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Pagination Counter */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>
            Trang <strong>{currentPage}</strong> / {totalPages} ({activeListLength} mục)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {activeTab === "TRACTORS" && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã Đầu Kéo</th>
                  <th className="py-2.5 px-3">Biển Số Xe</th>
                  <th className="py-2.5 px-3">Model / Nhãn Hiệu</th>
                  <th className="py-2.5 px-3">Hình Thức Sở Hữu</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái Vận Hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {paginatedTractors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Không tìm thấy đầu kéo phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedTractors.map((t, idx) => (
                    <tr key={t.tractorId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] w-12">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white text-[11px]">
                        {t.tractorId}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 text-sm">
                        {t.plateNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {t.model || "THACO Foton Auman"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300 border border-slate-700">
                          {t.ownership}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <ShieldCheck className="w-2.5 h-2.5" /> Sẵn sàng điều xe
                        </span>
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
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã Rơ-moóc</th>
                  <th className="py-2.5 px-3">Biển Số Moóc</th>
                  <th className="py-2.5 px-3">Chủng Loại Rơ-moóc</th>
                  <th className="py-2.5 px-3 text-right">Tải Trọng Cho Phép</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {paginatedTrailers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Không tìm thấy rơ-moóc phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedTrailers.map((tr, idx) => (
                    <tr key={tr.trailerId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] w-12">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white text-[11px]">
                        {tr.trailerId}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 text-sm">
                        {tr.plateNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200 font-semibold">
                        {tr.trailerType}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {tr.payloadCapacityKg ? new Intl.NumberFormat().format(tr.payloadCapacityKg) : "32,000"} kg
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <ShieldCheck className="w-2.5 h-2.5" /> Sẵn sàng ghép xe
                        </span>
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
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã Lái Xe</th>
                  <th className="py-2.5 px-3">Họ Và Tên Lái Xe</th>
                  <th className="py-2.5 px-3">Số Điện Thoại</th>
                  <th className="py-2.5 px-3 font-mono">Hạng GPLX</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái Điều Phối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {paginatedDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Không tìm thấy tài xế phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedDrivers.map((d, idx) => (
                    <tr key={d.driverId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] w-12">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white text-[11px]">
                        {d.driverId}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{d.fullName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {d.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{d.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">
                        <div className="flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{d.licenseNumber || "Hạng FC"}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <ShieldCheck className="w-2.5 h-2.5" /> Đang nhận chuyến
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
