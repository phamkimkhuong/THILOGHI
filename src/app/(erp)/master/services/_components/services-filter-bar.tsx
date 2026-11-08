"use client";

import { RotateCcw, Layers, CheckCircle2 } from "lucide-react";
import { FilterBarContainer, SearchInput, ChipScrollRow } from "@/components/ui/list-page";
import {
  CATEGORIES_LIST,
  STATUS_LIST,
  ServiceCategoryFilter,
  ServiceStatusFilter,
} from "./types";

interface ServicesFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: ServiceCategoryFilter;
  onCategoryChange: (category: ServiceCategoryFilter) => void;
  selectedStatus: ServiceStatusFilter;
  onStatusChange: (status: ServiceStatusFilter) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export function ServicesFilterBar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  categoryCounts,
  totalCount,
  filteredCount,
  onResetFilters,
}: ServicesFilterBarProps) {
  const isFiltered = Boolean(
    searchTerm || selectedCategory !== "ALL" || selectedStatus !== "ALL"
  );

  return (
    <FilterBarContainer className="font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo mã gói (TRUCKING...), tên dịch vụ, mô tả..."
          className="max-w-lg"
        />

        {/* Dropdown Trạng thái & Reset */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Trạng thái:
            </span>
            <select
              aria-label="Chọn trạng thái hoạt động"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as ServiceStatusFilter)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUS_LIST.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors border border-border"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}

          <div className="text-xs text-muted-foreground pl-1">
            Hiển thị <strong>{filteredCount}</strong> / {totalCount} gói dịch vụ
          </div>
        </div>
      </div>

      {/* ChipScrollRow cho nhóm danh mục */}
      <div className="pt-2 border-t border-border/50">
        <ChipScrollRow label="Phân nhóm" icon={Layers}>
          {CATEGORIES_LIST.map((cat) => {
            const count = cat.id === "ALL" ? totalCount : categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-[#2672df] text-white shadow-xs"
                    : "bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </ChipScrollRow>
      </div>
    </FilterBarContainer>
  );
}
