"use client";

import { RotateCcw, Globe, Filter } from "lucide-react";
import { FilterBarContainer, SearchInput, ChipScrollRow } from "@/components/ui/list-page";
import { COUNTRY_CONFIG, type LocationRecord, type RegionRecord } from "./types";

interface LocationFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  countryFilter: string;
  onCountryFilterChange: (code: string) => void;
  countryCounts: Record<string, number>;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  typeCounts: Record<string, number>;
  regionFilter: string;
  onRegionFilterChange: (regionId: string) => void;
  regions: RegionRecord[];
  totalLocations: number;
  crossRegionMatches: LocationRecord[];
  onResetFilters: () => void;
}

export function LocationFilterBar({
  searchTerm,
  onSearchChange,
  countryFilter,
  onCountryFilterChange,
  countryCounts,
  typeFilter,
  onTypeFilterChange,
  typeCounts,
  regionFilter,
  onRegionFilterChange,
  regions,
  totalLocations,
  crossRegionMatches,
  onResetFilters,
}: LocationFilterBarProps) {
  const isFiltered = Boolean(searchTerm || countryFilter !== "ALL" || typeFilter !== "ALL" || regionFilter !== "ALL");
  const currentRegionName = regions.find((r) => r.id === regionFilter)?.name || regionFilter;

  return (
    <FilterBarContainer>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Ô tìm kiếm thông minh hỗ trợ tiếng Việt có dấu và không dấu */}
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo tên địa điểm, mã, tỉnh/thành, đơn vị (AGRI, THILOGI...)..."
          className="max-w-lg"
        />

        {/* Phân vùng Dropdown & Reset */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto">
          <span className="text-muted-foreground font-medium shrink-0">Phân vùng:</span>
          <select
            aria-label="Phân vùng"
            value={regionFilter}
            onChange={(e) => onRegionFilterChange(e.target.value)}
            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 sm:flex-initial max-w-full"
          >
            <option value="ALL">Tất cả phân vùng ({regions.length})</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg border border-border hover:bg-surface-hover transition-colors shrink-0"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Bỏ lọc
            </button>
          )}
        </div>
      </div>

      {/* Hàng bộ lọc: Quốc gia & Loại hình */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
        {/* Lọc theo Quốc gia */}
        <ChipScrollRow label="Quốc gia" icon={Globe} className="mr-3">
          <button
            type="button"
            onClick={() => onCountryFilterChange("ALL")}
            className={`px-2 py-1 rounded-md text-xs font-medium shrink-0 transition-colors ${
              countryFilter === "ALL"
                ? "bg-blue-600 text-white font-bold"
                : "bg-background text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            Tất cả ({totalLocations})
          </button>
          {Object.entries(countryCounts).map(([code, count]) => {
            const cfg = COUNTRY_CONFIG[code] || { name: code, flag: "📍" };
            return (
              <button
                type="button"
                key={code}
                onClick={() => onCountryFilterChange(code)}
                className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shrink-0 transition-colors ${
                  countryFilter === code
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-background text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <span>{cfg.flag}</span>
                <span>{cfg.name}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </ChipScrollRow>

        {/* Lọc theo Loại hình */}
        <ChipScrollRow label="Loại hình" icon={Filter}>
          <button
            type="button"
            onClick={() => onTypeFilterChange("ALL")}
            className={`px-2 py-1 rounded-md text-xs font-medium shrink-0 transition-colors ${
              typeFilter === "ALL"
                ? "bg-blue-600 text-white font-bold"
                : "bg-background text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            Tất cả
          </button>
          {Object.entries(typeCounts).map(([type, count]) => (
            <button
              type="button"
              key={type}
              onClick={() => onTypeFilterChange(type)}
              className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                typeFilter === type
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {type} ({count})
            </button>
          ))}
        </ChipScrollRow>
      </div>

      {/* Cảnh báo kết quả tìm thấy ở phân vùng khác */}
      {crossRegionMatches.length > 0 && (
        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
          <span>
            💡 Tìm thấy <strong>{crossRegionMatches.length}</strong> địa điểm phù hợp với &quot;{searchTerm}&quot; ở phân vùng khác (hiện đang lọc theo {currentRegionName}).
          </span>
          <button
            type="button"
            onClick={() => onRegionFilterChange("ALL")}
            className="font-semibold underline ml-2 hover:text-blue-900 dark:hover:text-blue-100 cursor-pointer"
          >
            Xem tất cả kết quả
          </button>
        </div>
      )}
    </FilterBarContainer>
  );
}

