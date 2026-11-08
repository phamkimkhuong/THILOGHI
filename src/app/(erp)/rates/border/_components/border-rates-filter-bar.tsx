"use client";

import { RotateCcw, ShieldCheck, CheckCircle2, Globe2 } from "lucide-react";
import { FilterBarContainer, SearchInput, ChipScrollRow } from "@/components/ui/list-page";
import {
  COUNTRY_PAIRS,
  STATUS_OPTIONS,
  CountryPairFilter,
  BorderRateStatusFilter,
} from "./types";

interface BorderRatesFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCountryPair: CountryPairFilter;
  onCountryPairChange: (country: CountryPairFilter) => void;
  selectedBorderPair: string;
  onBorderPairChange: (pairId: string) => void;
  borderPairOptions: { id: string; name: string }[];
  selectedStatus: BorderRateStatusFilter;
  onStatusChange: (status: BorderRateStatusFilter) => void;
  countryPairCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export function BorderRatesFilterBar({
  searchTerm,
  onSearchChange,
  selectedCountryPair,
  onCountryPairChange,
  selectedBorderPair,
  onBorderPairChange,
  borderPairOptions,
  selectedStatus,
  onStatusChange,
  countryPairCounts,
  totalCount,
  filteredCount,
  onResetFilters,
}: BorderRatesFilterBarProps) {
  const isFiltered = Boolean(
    searchTerm ||
      selectedCountryPair !== "ALL" ||
      selectedBorderPair !== "ALL" ||
      selectedStatus !== "ALL"
  );

  return (
    <FilterBarContainer className="font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo cặp cửa khẩu (Bờ Y, Lao Bảo...), mặt hàng, tỉnh thành, ghi chú..."
          className="max-w-lg"
        />

        {/* Dropdowns & Reset */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
          {/* Dropdown Cặp Cửa khẩu */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" /> Cửa khẩu:
            </span>
            <select
              aria-label="Chọn cặp cửa khẩu"
              value={selectedBorderPair}
              onChange={(e) => onBorderPairChange(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px] truncate"
            >
              <option value="ALL">Tất cả cửa khẩu ({borderPairOptions.length})</option>
              {borderPairOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
              onChange={(e) => onStatusChange(e.target.value as BorderRateStatusFilter)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nút reset bộ lọc */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              aria-label="Đặt lại tất cả bộ lọc"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors shrink-0"
              title="Đặt lại tất cả bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* ChipScrollRow cho Quốc gia / Tuyến liên vận */}
      <div className="pt-2 border-t border-border/60">
        <ChipScrollRow label="Tuyến liên vận" icon={Globe2}>
          {COUNTRY_PAIRS.map((item) => {
            const isSelected = selectedCountryPair === item.id;
            const count =
              item.id === "ALL"
                ? totalCount
                : countryPairCounts[item.id] || 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onCountryPairChange(item.id)}
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : "bg-surface text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-white/25 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </ChipScrollRow>
      </div>

      {/* Thống kê kết quả lọc */}
      {isFiltered && (
        <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 font-mono">
          <span>
            Đang hiển thị <strong>{filteredCount}</strong> / {totalCount} biểu phí cửa khẩu
          </span>
          <span className="text-primary font-sans font-medium">Đang áp dụng bộ lọc</span>
        </div>
      )}
    </FilterBarContainer>
  );
}

