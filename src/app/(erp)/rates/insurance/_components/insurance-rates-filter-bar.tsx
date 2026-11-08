"use client";

import { Filter, X, Shield, CheckCircle2, Truck } from "lucide-react";
import {
  FilterBarContainer,
  SearchInput,
  ChipScrollRow,
} from "@/components/ui/list-page";
import {
  CoverageTypeFilter,
  TransportModeFilter,
  InsuranceRateStatusFilter,
  COVERAGE_TYPE_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  STATUS_OPTIONS,
} from "./types";

interface InsuranceRatesFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCoverage: CoverageTypeFilter;
  onCoverageChange: (value: CoverageTypeFilter) => void;
  selectedInsurer: string;
  onInsurerChange: (value: string) => void;
  insurerOptions: { id: string; name: string }[];
  selectedTransportMode: TransportModeFilter;
  onTransportModeChange: (value: TransportModeFilter) => void;
  selectedStatus: InsuranceRateStatusFilter;
  onStatusChange: (value: InsuranceRateStatusFilter) => void;
  coverageCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export function InsuranceRatesFilterBar({
  searchTerm,
  onSearchChange,
  selectedCoverage,
  onCoverageChange,
  selectedInsurer,
  onInsurerChange,
  insurerOptions,
  selectedTransportMode,
  onTransportModeChange,
  selectedStatus,
  onStatusChange,
  coverageCounts,
  totalCount,
  filteredCount,
  onResetFilters,
}: InsuranceRatesFilterBarProps) {
  const isFiltered =
    Boolean(searchTerm) ||
    selectedCoverage !== "ALL" ||
    selectedInsurer !== "ALL" ||
    selectedTransportMode !== "ALL" ||
    selectedStatus !== "ALL";

  return (
    <FilterBarContainer>
      {/* Hàng 1: Ô tìm kiếm và các Dropdown lọc chính */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo công ty bảo hiểm, phạm vi, phương thức vận tải, mặt hàng..."
          className="max-w-md"
        />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 justify-end">
          {/* Dropdown Đơn vị bảo hiểm */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              aria-label="Lọc theo đơn vị bảo hiểm"
              value={selectedInsurer}
              onChange={(e) => onInsurerChange(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả đơn vị bảo hiểm ({insurerOptions.length})</option>
              {insurerOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Phương thức vận tải */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Truck className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              aria-label="Lọc theo phương thức vận tải"
              value={selectedTransportMode}
              onChange={(e) => onTransportModeChange(e.target.value as TransportModeFilter)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {TRANSPORT_MODE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Trạng thái */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              aria-label="Lọc theo trạng thái hiệu lực"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as InsuranceRateStatusFilter)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nút Xóa bộ lọc */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa lọc ({filteredCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Hàng 2: Dãy Chip lọc Phạm vi bảo hiểm cuộn ngang an toàn */}
      <div className="pt-2 border-t border-border/60">
        <ChipScrollRow label="Phạm vi bảo hiểm" icon={Filter}>
          {COVERAGE_TYPE_OPTIONS.map((cov) => {
            const isSelected = selectedCoverage === cov.id;
            const count =
              cov.id === "ALL"
                ? totalCount
                : coverageCounts[cov.id] || 0;

            return (
              <button
                key={cov.id}
                type="button"
                onClick={() => onCoverageChange(cov.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <span>{cov.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? "bg-blue-700/60 text-white"
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
    </FilterBarContainer>
  );
}

