"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  RefreshCw,
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
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(() => {
    startTransition(async () => {
      const res = await getCommoditiesAction();
      if (res.success) {
        setCommodities((res.data || []) as CommodityRecord[]);
      }
    });
  }, []);

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

  return (
    <div className="space-y-4 font-sans text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              COMMODITIES MASTER DIRECTORY
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Hiển thị: <strong>{filteredCommodities.length}</strong> / {commodities.length} mặt hàng
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Danh Mục Mặt Hàng Vận Chuyển
          </h1>
          <p className="text-xs text-slate-400">
            Nông sản xuất khẩu (Chuối, Sầu riêng, Xoài...), Phụ tùng ô tô THACO, Hóa chất và Khoáng sản
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
            placeholder="Tìm theo tên mặt hàng, mã hàng, yêu cầu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Mã Hàng</th>
                <th className="py-2.5 px-3">Tên Mặt Hàng</th>
                <th className="py-2.5 px-3">Nhóm / Phân Loại</th>
                <th className="py-2.5 px-3">Quy Cách / Ghi Chú</th>
                <th className="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredCommodities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Không tìm thấy mặt hàng phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCommodities.map((m) => (
                  <tr key={m.commodityId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-white text-[11px] whitespace-nowrap">
                      {m.commodityId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-100 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{m.name}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-cyan-400">
                        {m.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-[220px] truncate" title={m.specialRequirements || m.notes}>
                      {m.specialRequirements || m.notes || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/quotations/new?commodityId=${m.commodityId}`}
                        className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <PlusCircle className="w-3 h-3" /> Lập Báo Giá
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
