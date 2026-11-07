"use client";

import React from "react";
import { Filter, MapPin } from "lucide-react";
import { FilterBarContainer, ChipScrollRow, SearchInput } from "@/components/ui/list-page";
import { STATUS_TABS } from "./types";

interface QuotationsFilterBarProps {
  status: string;
  onStatusChange: (status: string) => void;
  regionId: string;
  onRegionChange: (regionId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  regions: Array<{ id: string; name: string }>;
  totalCount?: number;
}

export function QuotationsFilterBar({
  status,
  onStatusChange,
  regionId,
  onRegionChange,
  search,
  onSearchChange,
  regions,
  totalCount,
}: QuotationsFilterBarProps) {
  const regionOptions = [{ id: "ALL", name: "Tất cả phân vùng" }, ...regions];

  return (
    <FilterBarContainer>
      {/* Hàng 1: Dãy Chip phân loại trạng thái cuộn ngang mượt mà trên mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <ChipScrollRow label="Trạng thái" icon={Filter}>
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </ChipScrollRow>

        {totalCount !== undefined && (
          <div className="hidden lg:flex items-center text-xs text-muted-foreground font-mono">
            Tổng: <strong className="ml-1 text-foreground">{totalCount}</strong> hồ sơ
          </div>
        )}
      </div>

      {/* Hàng 2: Bộ chọn phân vùng + Ô tìm kiếm chuẩn SearchInput */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-border/60">
        {/* Phân vùng Dropdown */}
        <div className="relative min-w-[180px] sm:w-56 shrink-0">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <select
            aria-label="Lọc theo phân vùng nghiệp vụ"
            value={regionId}
            onChange={(e) => onRegionChange(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
          >
            {regionOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ô tìm kiếm SearchInput chuẩn với nút xóa X tự động */}
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Tìm số báo giá, tên khách hàng, người lập..."
          className="flex-1"
        />
      </div>
    </FilterBarContainer>
  );
}

