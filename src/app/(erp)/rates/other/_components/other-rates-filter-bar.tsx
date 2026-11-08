"use client";

import { Filter, X, Building, CheckCircle2, DollarSign } from "lucide-react";
import {
  FilterBarContainer,
  SearchInput,
  ChipScrollRow,
} from "@/components/ui/list-page";
import {
  ServiceCodeFilter,
  PricingMethodFilter,
  OtherRateStatusFilter,
  OTHER_SERVICE_CODE_OPTIONS,
  PRICING_METHOD_OPTIONS,
  STATUS_OPTIONS,
} from "./types";

interface OtherRatesFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCode: ServiceCodeFilter;
  onCodeChange: (value: ServiceCodeFilter) => void;
  selectedProvider: string;
  onProviderChange: (value: string) => void;
  providerOptions: { id: string; name: string }[];
  selectedPricingMethod: PricingMethodFilter;
  onPricingMethodChange: (value: PricingMethodFilter) => void;
  selectedStatus: OtherRateStatusFilter;
  onStatusChange: (value: OtherRateStatusFilter) => void;
  codeCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export function OtherRatesFilterBar({
  searchTerm,
  onSearchChange,
  selectedCode,
  onCodeChange,
  selectedProvider,
  onProviderChange,
  providerOptions,
  selectedPricingMethod,
  onPricingMethodChange,
  selectedStatus,
  onStatusChange,
  codeCounts,
  totalCount,
  filteredCount,
  onResetFilters,
}: OtherRatesFilterBarProps) {
  const isFiltered =
    Boolean(searchTerm) ||
    selectedCode !== "ALL" ||
    selectedProvider !== "ALL" ||
    selectedPricingMethod !== "ALL" ||
    selectedStatus !== "ALL";

  return (
    <FilterBarContainer>
      {/* Hàng 1: Ô tìm kiếm và các Dropdown lọc chính */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo mã dịch vụ, tên dịch vụ, đơn vị cung cấp, ghi chú..."
          className="max-w-md"
        />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 justify-end">
          {/* Dropdown Đơn vị cung cấp */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Building className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              aria-label="Lọc theo đơn vị cung cấp"
              value={selectedProvider}
              onChange={(e) => onProviderChange(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả nhà cung cấp ({providerOptions.length})</option>
              {providerOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Phương pháp tính giá */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              aria-label="Lọc theo phương pháp định giá"
              value={selectedPricingMethod}
              onChange={(e) => onPricingMethodChange(e.target.value as PricingMethodFilter)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả phương pháp</option>
              {PRICING_METHOD_OPTIONS.map((opt) => (
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
              onChange={(e) => onStatusChange(e.target.value as OtherRateStatusFilter)}
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

      {/* Hàng 2: Dãy Chip lọc Mã dịch vụ cuộn ngang an toàn */}
      <div className="pt-2 border-t border-border/60">
        <ChipScrollRow label="Nhóm dịch vụ khác" icon={Filter}>
          {OTHER_SERVICE_CODE_OPTIONS.map((code) => {
            const isSelected = selectedCode === code.id;
            const count =
              code.id === "ALL"
                ? totalCount
                : codeCounts[code.id] || 0;

            return (
              <button
                key={code.id}
                type="button"
                onClick={() => onCodeChange(code.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <span>{code.label}</span>
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

