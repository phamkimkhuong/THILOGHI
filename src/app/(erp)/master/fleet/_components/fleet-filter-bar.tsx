"use client";

import {
  SearchInput,
  FilterBarContainer,
  ChipScrollRow,
} from "@/components/ui/list-page";
import { Truck, Container, User, Building2, Route, RotateCcw } from "lucide-react";
import { FleetActiveTab } from "./types";

interface FleetFilterBarProps {
  activeTab: FleetActiveTab;
  onTabChange: (tab: FleetActiveTab) => void;
  tractorCount: number;
  trailerCount: number;
  driverCount: number;

  searchTerm: string;
  onSearchChange: (val: string) => void;

  selectedOwnership: "ALL" | "INTERNAL" | "SUBCONTRACTOR";
  onOwnershipChange: (val: "ALL" | "INTERNAL" | "SUBCONTRACTOR") => void;
  ownershipCounts: { all: number; internal: number; sub: number };

  // Sub-filter for specific tab
  subFilter: string;
  onSubFilterChange: (val: string) => void;
  subFilterOptions: { value: string; label: string; count?: number }[];
  subFilterLabel: string;

  onResetFilters: () => void;
}

export function FleetFilterBar({
  activeTab,
  onTabChange,
  tractorCount,
  trailerCount,
  driverCount,
  searchTerm,
  onSearchChange,
  selectedOwnership,
  onOwnershipChange,
  ownershipCounts,
  subFilter,
  onSubFilterChange,
  subFilterOptions,
  subFilterLabel,
  onResetFilters,
}: FleetFilterBarProps) {
  const isFiltered =
    searchTerm.trim() !== "" ||
    selectedOwnership !== "ALL" ||
    subFilter !== "ALL";

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Dãy Tab danh mục phương tiện / tài sản vận tải */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Danh mục tài sản đội xe"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "TRACTORS"}
          onClick={() => onTabChange("TRACTORS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "TRACTORS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-surface hover:bg-surface-hover text-foreground border border-border"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Đầu kéo</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
              activeTab === "TRACTORS"
                ? "bg-white/20 text-white"
                : "bg-background text-muted-foreground border border-border"
            }`}
          >
            {tractorCount}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "TRAILERS"}
          onClick={() => onTabChange("TRAILERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "TRAILERS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-surface hover:bg-surface-hover text-foreground border border-border"
          }`}
        >
          <Container className="w-4 h-4" />
          <span>Rơ-moóc</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
              activeTab === "TRAILERS"
                ? "bg-white/20 text-white"
                : "bg-background text-muted-foreground border border-border"
            }`}
          >
            {trailerCount}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "DRIVERS"}
          onClick={() => onTabChange("DRIVERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "DRIVERS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-surface hover:bg-surface-hover text-foreground border border-border"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Tài xế / Lái xe</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
              activeTab === "DRIVERS"
                ? "bg-white/20 text-white"
                : "bg-background text-muted-foreground border border-border"
            }`}
          >
            {driverCount}
          </span>
        </button>
      </div>

      {/* 2. Thanh lọc Đa Chiều & Tìm Kiếm */}
      <FilterBarContainer>
        {/* Ô tìm kiếm chuẩn */}
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={
            activeTab === "TRACTORS"
              ? "Tìm theo biển số, dòng xe, nhà xe, tuyến liên vận..."
              : activeTab === "TRAILERS"
              ? "Tìm theo biển số moóc, chủng loại (RMX, RMS...), nhà sản xuất..."
              : "Tìm theo họ tên tài xế, SĐT, số GPLX, quê quán..."
          }
        />

        {/* Chip lọc Hình thức sở hữu / Nhà xe */}
        <ChipScrollRow label="Sở hữu" icon={Building2}>
          <button
            type="button"
            onClick={() => onOwnershipChange("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedOwnership === "ALL"
                ? "bg-blue-600 text-white font-bold"
                : "bg-surface text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            Tất cả ({ownershipCounts.all})
          </button>
          <button
            type="button"
            onClick={() => onOwnershipChange("INTERNAL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedOwnership === "INTERNAL"
                ? "bg-blue-600 text-white font-bold"
                : "bg-surface text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            THILOTRANS Nội bộ ({ownershipCounts.internal})
          </button>
          <button
            type="button"
            onClick={() => onOwnershipChange("SUBCONTRACTOR")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedOwnership === "SUBCONTRACTOR"
                ? "bg-blue-600 text-white font-bold"
                : "bg-surface text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            Thầu phụ vệ tinh ({ownershipCounts.sub})
          </button>
        </ChipScrollRow>

        {/* Chip lọc đặc thù theo Tab (Tuyến liên vận / Chủng loại moóc / Trạng thái hồ sơ) */}
        {subFilterOptions.length > 0 && (
          <ChipScrollRow label={subFilterLabel} icon={Route}>
            <button
              type="button"
              onClick={() => onSubFilterChange("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                subFilter === "ALL"
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-surface text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Tất cả
            </button>
            {subFilterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSubFilterChange(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  subFilter === opt.value
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-surface text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {opt.label}
                {opt.count != null && (
                  <span className="ml-1 opacity-75 font-mono text-[11px]">
                    ({opt.count})
                  </span>
                )}
              </button>
            ))}
          </ChipScrollRow>
        )}

        {/* Nút đặt lại bộ lọc */}
        {isFiltered && (
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-surface transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </FilterBarContainer>
    </div>
  );
}

