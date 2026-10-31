"use client";

import { PageHeader, RefreshButton, TableFeedback, Pagination, usePagination, useListFeedback } from "@/components/ui/list-page";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  PlusCircle,
  Filter,
} from "lucide-react";
import { getCommoditiesAction } from "@/features/master-data/actions";

interface CommodityRecord {
  commodityId: string;
  name: string;
  category: string;
  specialRequirements?: string;
  notes?: string;
}

export default function MasterCommoditiesPage() {
  const [commodities, setCommodities] = useState<CommodityRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const { loading, error: loadError, runLoad } = useListFeedback();

  const loadData = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const res = await getCommoditiesAction();
      if (!res.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      if (res.success) {
        setCommodities((res.data || []) as CommodityRecord[]);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    commodities.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [commodities]);

  // Instant Client-side Search & Filter
  const filteredCommodities = useMemo(() => {
    let list = [...commodities];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.commodityId.toLowerCase().includes(q) ||
          (c.specialRequirements && c.specialRequirements.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "ALL") {
      list = list.filter((c) => c.category === selectedCategory);
    }

    return list;
  }, [commodities, searchTerm, selectedCategory]);

  const pagination = usePagination(filteredCommodities.length, JSON.stringify([searchTerm, selectedCategory]));

  return (
    <div className="space-y-4 font-sans text-slate-200">
      <PageHeader title="Hàng hóa" actions={<><RefreshButton onClick={loadData} loading={loading} /></>} />

      {/* Multi-Filter Bar */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Instant Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo tên mặt hàng, mã hàng, yêu cầu..." aria-label="Tìm theo tên mặt hàng, mã hàng, yêu cầu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Nhóm:
          </span>
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === "ALL"
                ? "bg-blue-600 text-white font-bold"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Tất cả ({commodities.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
          <table className="erp-table w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Mã hàng</th>
                <th className="py-2.5 px-3">Tên hàng hóa</th>
                <th className="py-2.5 px-3">Nhóm / Phân loại</th>
                <th className="py-2.5 px-3">Quy cách / Ghi chú</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading || loadError ? <TableFeedback columns={5} loading={loading} error={loadError} onRetry={loadData} /> : filteredCommodities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Không tìm thấy mặt hàng phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCommodities.slice(pagination.start, pagination.end).map((m) => (
                  <tr key={m.commodityId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-white text-xs whitespace-nowrap">
                      {m.commodityId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-100 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{m.name}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-xs px-1.5 py-0.2 rounded bg-slate-800 font-mono text-cyan-400">
                        {m.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs max-w-[220px] truncate" title={m.specialRequirements || m.notes}>
                      {m.specialRequirements || m.notes || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/quotations/new?commodityId=${m.commodityId}`}
                        className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <PlusCircle className="w-3 h-3" /> Lập báo giá
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} loading={loading} error={!!loadError} loaded={commodities.length} limit={100} />
      </div>
    </div>
  );
}
