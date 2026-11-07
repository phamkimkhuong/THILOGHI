"use client";

import { Globe, CheckCircle2, RotateCcw } from "lucide-react";
import { FilterBarContainer, SearchInput } from "@/components/ui/list-page";
import { PARTNER_TYPE_CHIPS, COUNTRY_FILTER_OPTIONS } from "./types";

interface PartnerFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPartnerType: string;
  onPartnerTypeChange: (type: string) => void;
  typeCounts: Record<string, number>;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  countryCounts: Record<string, number>;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedRole?: string;
  onRoleChange?: (role: string) => void;
  onResetFilters: () => void;
}

export function PartnerFilterBar(props: PartnerFilterBarProps) {
  const {
    searchTerm,
    onSearchChange,
    selectedPartnerType,
    onPartnerTypeChange,
    typeCounts,
    selectedCountry,
    onCountryChange,
    countryCounts,
    selectedStatus,
    onStatusChange,
    onResetFilters,
  } = props;
  const isFiltered = Boolean(
    searchTerm.trim() ||
    selectedPartnerType !== "ALL" ||
    selectedCountry !== "ALL" ||
    selectedStatus !== "ALL"
  );

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Thanh 1-Click Chọn 9 Phân nhóm đối tác (Chips Bar chuẩn AppSheet / Logistics) */}
      <div className="p-1.5 rounded-xl bg-surface border border-border flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-xs">
        {PARTNER_TYPE_CHIPS.map((chip) => {
          const isSelected = selectedPartnerType === chip.value;
          const count = typeCounts[chip.value] ?? 0;

          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onPartnerTypeChange(chip.value)}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <span>{chip.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? "bg-white/25 text-white font-bold" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Toolbar Tìm kiếm & Dropdowns Lọc Chuyên Sâu */}
      <FilterBarContainer>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Ô tìm kiếm thông minh */}
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Tìm theo tên, mã đối tác, tên ngắn, MST, người đại diện, SĐT..."
            className="max-w-md"
          />

          {/* Dãy Dropdowns lọc */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
            {/* Lọc theo Quốc gia */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                <Globe className="w-3.5 h-3.5 text-blue-600" /> Quốc gia:
              </span>
              <select
                aria-label="Lọc theo quốc gia"
                value={selectedCountry}
                onChange={(e) => onCountryChange(e.target.value)}
                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
              >
                {COUNTRY_FILTER_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label} {countryCounts[c.value] !== undefined ? `(${countryCounts[c.value]})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Trạng thái Hoạt động */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Trạng thái:
              </span>
              <select
                aria-label="Lọc theo trạng thái"
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
              </select>
            </div>

            {/* Nút Reset bộ lọc */}
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
      </FilterBarContainer>
    </div>
  );
}
