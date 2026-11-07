"use client";

import { Filter, ArrowUpDown } from "lucide-react";
import { FilterBarContainer, SearchInput, ChipScrollRow } from "@/components/ui/list-page";
import type { RoadRateSortOption } from "./types";

interface RatesFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedEquipment: string;
  onEquipmentChange: (val: string) => void;
  uniqueEquipments: string[];
  sortBy: RoadRateSortOption;
  onSortByChange: (val: RoadRateSortOption) => void;
  totalCount: number;
  filteredCount: number;
}

export function RatesFilterBar({
  searchTerm,
  onSearchChange,
  selectedEquipment,
  onEquipmentChange,
  uniqueEquipments,
  sortBy,
  onSortByChange,
  totalCount,
  filteredCount,
}: RatesFilterBarProps) {
  const isFiltered = Boolean(searchTerm || selectedEquipment !== "ALL");

  return (
    <FilterBarContainer className="font-sans space-y-3">
      {/* Hàng 1: Ô tìm kiếm chuẩn chống đè & Dropdown sắp xếp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo nhà xe, điểm xếp, điểm dỡ, mã cảng..."
          className="max-w-md"
        />

        <div className="flex items-center gap-1.5 shrink-0 text-xs self-start sm:self-auto">
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
          </span>
          <select
            aria-label="Sắp xếp giá mua"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as RoadRateSortOption)}
            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="route">Tuyến đường (A &rarr; Z)</option>
            <option value="price_asc">Giá mua tăng dần (theo tiền tệ)</option>
            <option value="price_desc">Giá mua giảm dần (theo tiền tệ)</option>
          </select>
        </div>
      </div>

      {/* Hàng 2: Dải Chip Thiết bị Cont cuộn ngang an toàn trên Mobile */}
      <ChipScrollRow label="Thiết bị / Cont" icon={Filter}>
        <button
          type="button"
          onClick={() => onEquipmentChange("ALL")}
          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors cursor-pointer border ${
            selectedEquipment === "ALL"
              ? "bg-primary text-primary-foreground font-bold shadow-xs border-primary"
              : "bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover border-border"
          }`}
        >
          Tất cả ({totalCount})
        </button>
        {uniqueEquipments.map((eq) => (
          <button
            key={eq}
            type="button"
            onClick={() => onEquipmentChange(eq)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              selectedEquipment === eq
                ? "bg-primary text-primary-foreground font-bold shadow-xs border-primary"
                : "bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover border-border"
            }`}
          >
            {eq}
          </button>
        ))}
      </ChipScrollRow>

      {/* Hiển thị số kết quả lọc */}
      {isFiltered && (
        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
          Đang hiển thị <strong>{filteredCount}</strong> / {totalCount} biểu cước đường bộ phù hợp.
        </div>
      )}
    </FilterBarContainer>
  );
}

