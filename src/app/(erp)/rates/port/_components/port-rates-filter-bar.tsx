"use client";

import { RotateCcw, Anchor, CheckCircle2, Box } from "lucide-react";
import { FilterBarContainer, SearchInput, ChipScrollRow } from "@/components/ui/list-page";
import {
  CHARGE_CODES,
  CONTAINER_TYPES,
  STATUS_OPTIONS,
  ChargeCodeFilter,
  ContainerTypeFilter,
  PortRateStatusFilter,
} from "./types";

interface PortRatesFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedChargeCode: ChargeCodeFilter;
  onChargeCodeChange: (code: ChargeCodeFilter) => void;
  selectedContainerType: ContainerTypeFilter;
  onContainerTypeChange: (cont: ContainerTypeFilter) => void;
  selectedStatus: PortRateStatusFilter;
  onStatusChange: (status: PortRateStatusFilter) => void;
  chargeCodeCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export function PortRatesFilterBar({
  searchTerm,
  onSearchChange,
  selectedChargeCode,
  onChargeCodeChange,
  selectedContainerType,
  onContainerTypeChange,
  selectedStatus,
  onStatusChange,
  chargeCodeCounts,
  totalCount,
  filteredCount,
  onResetFilters,
}: PortRatesFilterBarProps) {
  const isFiltered = Boolean(
    searchTerm ||
      selectedChargeCode !== "ALL" ||
      selectedContainerType !== "ALL" ||
      selectedStatus !== "ALL"
  );

  return (
    <FilterBarContainer className="font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo tác nghiệp (LOLO, POWER...), loại cont (20GP, 40HC), ghi chú..."
          className="max-w-lg"
        />

        {/* Dropdowns & Reset */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
          {/* Dropdown Loại Cont */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <Box className="w-3.5 h-3.5" /> Loại cont:
            </span>
            <select
              aria-label="Chọn loại container"
              value={selectedContainerType}
              onChange={(e) => onContainerTypeChange(e.target.value as ContainerTypeFilter)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CONTAINER_TYPES.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.label}
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
              aria-label="Chọn trạng thái áp dụng"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as PortRateStatusFilter)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((st) => (
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
            Hiển thị <strong>{filteredCount}</strong> / {totalCount} biểu phí
          </div>
        </div>
      </div>

      {/* ChipScrollRow cho nhóm Tác nghiệp */}
      <div className="pt-2 border-t border-border/50">
        <ChipScrollRow label="Tác nghiệp cảng" icon={Anchor}>
          {CHARGE_CODES.map((code) => {
            const count = code.id === "ALL" ? totalCount : chargeCodeCounts[code.id] || 0;
            const isSelected = selectedChargeCode === code.id;

            return (
              <button
                key={code.id}
                type="button"
                onClick={() => onChargeCodeChange(code.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-surface text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span>{code.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
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

