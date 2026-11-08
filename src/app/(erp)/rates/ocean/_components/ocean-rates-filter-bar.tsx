"use client";

import { RotateCcw, Ship, Anchor, CheckCircle2, PackageCheck } from "lucide-react";
import { FilterBarContainer, SearchInput, ChipScrollRow } from "@/components/ui/list-page";
import {
  CONTAINER_TYPE_OPTIONS,
  STATUS_OPTIONS,
  ContainerTypeFilter,
  OceanRateStatusFilter,
} from "./types";

interface OceanRatesFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCarrier: string;
  onCarrierChange: (carrierId: string) => void;
  carrierOptions: { carrierId: string; carrierName: string }[];
  selectedPol: string;
  onPolChange: (polId: string) => void;
  selectedPod: string;
  onPodChange: (podId: string) => void;
  portOptions: { portId: string; portName: string; countryCode: string }[];
  selectedContainerType: ContainerTypeFilter;
  onContainerTypeChange: (type: ContainerTypeFilter) => void;
  selectedStatus: OceanRateStatusFilter;
  onStatusChange: (status: OceanRateStatusFilter) => void;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export function OceanRatesFilterBar({
  searchTerm,
  onSearchChange,
  selectedCarrier,
  onCarrierChange,
  carrierOptions,
  selectedPol,
  onPolChange,
  selectedPod,
  onPodChange,
  portOptions,
  selectedContainerType,
  onContainerTypeChange,
  selectedStatus,
  onStatusChange,
  totalCount,
  filteredCount,
  onResetFilters,
}: OceanRatesFilterBarProps) {
  const isFiltered = Boolean(
    searchTerm ||
      selectedCarrier !== "ALL" ||
      selectedPol !== "ALL" ||
      selectedPod !== "ALL" ||
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
          placeholder="Tìm hãng tàu, cảng đi (Chu Lai...), cảng đến (Đại Liên, Xà Khẩu...), mặt hàng..."
          className="max-w-lg"
        />

        {/* Dropdowns & Reset */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
          {/* Cảng đi (POL) */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <Anchor className="w-3.5 h-3.5 text-blue-600" /> Cảng đi (POL):
            </span>
            <select
              aria-label="Chọn cảng đi"
              value={selectedPol}
              onChange={(e) => onPolChange(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate"
            >
              <option value="ALL">Tất cả cảng đi</option>
              {portOptions.map((p) => (
                <option key={p.portId} value={p.portId}>
                  {p.portName} ({p.portId})
                </option>
              ))}
            </select>
          </div>

          {/* Cảng đến (POD) */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <Anchor className="w-3.5 h-3.5 text-emerald-600" /> Cảng đến (POD):
            </span>
            <select
              aria-label="Chọn cảng đến"
              value={selectedPod}
              onChange={(e) => onPodChange(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate"
            >
              <option value="ALL">Tất cả cảng đến</option>
              {portOptions.map((p) => (
                <option key={p.portId} value={p.portId}>
                  {p.portName} ({p.portId})
                </option>
              ))}
            </select>
          </div>

          {/* Trạng thái */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Trạng thái:
            </span>
            <select
              aria-label="Chọn trạng thái"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value as OceanRateStatusFilter)}
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

      {/* ChipScrollRow cho Hãng tàu */}
      <div className="pt-2 border-t border-border/60">
        <ChipScrollRow label="Hãng tàu" icon={Ship}>
          <button
            type="button"
            onClick={() => onCarrierChange("ALL")}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all shrink-0 ${
              selectedCarrier === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-surface text-muted-foreground hover:text-foreground border border-border hover:bg-muted/50"
            }`}
          >
            Tất cả ({totalCount})
          </button>
          {carrierOptions.map((c) => (
            <button
              key={c.carrierId}
              type="button"
              onClick={() => onCarrierChange(c.carrierId)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all shrink-0 ${
                selectedCarrier === c.carrierId
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface text-muted-foreground hover:text-foreground border border-border hover:bg-muted/50"
              }`}
            >
              {c.carrierId}
            </button>
          ))}
        </ChipScrollRow>
      </div>

      {/* ChipScrollRow cho Loại Container */}
      <div className="pt-2 border-t border-border/60">
        <ChipScrollRow label="Loại container" icon={PackageCheck}>
          {CONTAINER_TYPE_OPTIONS.map((ct) => (
            <button
              key={ct.id}
              type="button"
              onClick={() => onContainerTypeChange(ct.id)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all shrink-0 ${
                selectedContainerType === ct.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface text-muted-foreground hover:text-foreground border border-border hover:bg-muted/50"
              }`}
            >
              {ct.label}
            </button>
          ))}
        </ChipScrollRow>
      </div>

      {/* Tóm tắt số lượng */}
      <div className="pt-1 text-xs text-muted-foreground flex items-center justify-between">
        <span>
          Hiển thị <strong>{filteredCount}</strong> / {totalCount} biểu cước vận tải biển
        </span>
      </div>
    </FilterBarContainer>
  );
}

