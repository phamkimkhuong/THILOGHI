"use client";

import { Filter, X, Building, CheckCircle2 } from "lucide-react";
import {
  FilterBarContainer,
  SearchInput,
  ChipScrollRow,
} from "@/components/ui/list-page";
import {
  CustomsProcedureFilter,
  CustomsServiceCodeFilter,
  CustomsRateStatusFilter,
  PROCEDURE_OPTIONS,
  SERVICE_CODE_OPTIONS,
  STATUS_OPTIONS,
} from "./types";

interface CustomsRatesFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedProcedure: CustomsProcedureFilter;
  onProcedureChange: (value: CustomsProcedureFilter) => void;
  selectedOffice: string;
  onOfficeChange: (value: string) => void;
  officeOptions: { id: string; name: string }[];
  selectedServiceCode: CustomsServiceCodeFilter;
  onServiceCodeChange: (value: CustomsServiceCodeFilter) => void;
  selectedStatus: CustomsRateStatusFilter;
  onStatusChange: (value: CustomsRateStatusFilter) => void;
  procedureCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export function CustomsRatesFilterBar({
  searchTerm,
  onSearchChange,
  selectedProcedure,
  onProcedureChange,
  selectedOffice,
  onOfficeChange,
  officeOptions,
  selectedServiceCode,
  onServiceCodeChange,
  selectedStatus,
  onStatusChange,
  procedureCounts,
  totalCount,
  filteredCount,
  onResetFilters,
}: CustomsRatesFilterBarProps) {
  const isFiltered =
    Boolean(searchTerm) ||
    selectedProcedure !== "ALL" ||
    selectedOffice !== "ALL" ||
    selectedServiceCode !== "ALL" ||
    selectedStatus !== "ALL";

  return (
    <FilterBarContainer>
      {/* Hàng 1: Ô tìm kiếm và các Dropdown lọc chính */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo đại lý hải quan, chi cục, tên dịch vụ, mặt hàng..."
          className="max-w-md"
        />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 justify-end">
          {/* Dropdown Chi cục Hải quan */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Building className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              aria-label="Lọc theo chi cục hải quan"
              value={selectedOffice}
              onChange={(e) => onOfficeChange(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">Tất cả chi cục ({officeOptions.length})</option>
              {officeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Nhóm dịch vụ */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <select
              aria-label="Lọc theo nhóm dịch vụ hải quan"
              value={selectedServiceCode}
              onChange={(e) => onServiceCodeChange(e.target.value as CustomsServiceCodeFilter)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {SERVICE_CODE_OPTIONS.map((opt) => (
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
              onChange={(e) => onStatusChange(e.target.value as CustomsRateStatusFilter)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Nút Xóa bộ lọc nếu đang có filter */}
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

      {/* Hàng 2: Dãy Chip lọc Loại hình tờ khai Hải quan cuộn ngang an toàn */}
      <div className="pt-2 border-t border-border/60">
        <ChipScrollRow label="Loại hình" icon={Filter}>
          {PROCEDURE_OPTIONS.map((proc) => {
            const isSelected = selectedProcedure === proc.id;
            const count =
              proc.id === "ALL"
                ? totalCount
                : procedureCounts[proc.id] || 0;

            return (
              <button
                key={proc.id}
                type="button"
                onClick={() => onProcedureChange(proc.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <span>{proc.label}</span>
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

