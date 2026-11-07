"use client";

import { RotateCcw, Filter, CheckCircle2 } from "lucide-react";
import { FilterBarContainer, SearchInput } from "@/components/ui/list-page";

interface CommodityFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export function CommodityFilterBar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  categoryCounts,
  selectedStatus,
  onStatusChange,
  totalCount,
  filteredCount,
  onResetFilters,
}: CommodityFilterBarProps) {
  const isFiltered = Boolean(searchTerm || selectedCategory !== "ALL" || selectedStatus !== "ALL");

  return (
    <FilterBarContainer className="font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo tên mặt hàng, tên tiếng Anh, mã, xuất xứ, quy cách..."
          className="max-w-lg"
        />

        {/* Dropdown Phân loại & Trạng thái & Reset */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
          {/* Dropdown Nhóm */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Nhóm:
            </span>
            <select
              aria-label="Chọn nhóm hàng"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả nhóm ({totalCount})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Trạng thái */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Trạng thái:
            </span>
            <select
              aria-label="Chọn trạng thái"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Đã duyệt">Đã duyệt (Active)</option>
              <option value="Tạm ngưng">Tạm ngưng (Inactive)</option>
            </select>
          </div>

          {/* Nút Reset */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg border border-border hover:bg-surface-hover transition-colors cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Bỏ lọc
            </button>
          )}
        </div>
      </div>

      {/* Hiển thị số kết quả */}
      {isFiltered && (
        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          Đang hiển thị <strong>{filteredCount}</strong> / {totalCount} mặt hàng phù hợp với bộ lọc.
        </div>
      )}
    </FilterBarContainer>
  );
}

