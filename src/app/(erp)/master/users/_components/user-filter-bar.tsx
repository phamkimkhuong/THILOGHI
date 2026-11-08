"use client";

import { FilterBarContainer, ChipScrollRow, SearchInput } from "@/components/ui/list-page";
import { Shield, Filter } from "lucide-react";
import {
  ROLES_LIST,
  STATUS_LIST,
  type UserRoleFilter,
  type UserStatusFilter,
} from "./types";

interface UserFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedRole: UserRoleFilter;
  onRoleChange: (role: UserRoleFilter) => void;
  selectedStatus: UserStatusFilter;
  onStatusChange: (status: UserStatusFilter) => void;
  roleCounts: Record<string, number>;
  totalCount: number;
}

export function UserFilterBar({
  searchTerm,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  roleCounts,
  totalCount,
}: UserFilterBarProps) {
  return (
    <FilterBarContainer>
      {/* 1. Ô tìm kiếm toàn màn hình */}
      <div className="w-full">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Tìm theo họ tên, tên đăng nhập, email, phòng ban, công ty..."
        />
      </div>

      {/* 2. Dãy Chip chọn vai trò */}
      <ChipScrollRow label="Vai trò" icon={Shield}>
        <button
          type="button"
          onClick={() => onRoleChange("ALL")}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
            selectedRole === "ALL"
              ? "bg-[#2672df] text-white shadow-xs font-semibold"
              : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-border"
          }`}
        >
          Tất cả ({totalCount})
        </button>
        {ROLES_LIST.map((role) => {
          const count = roleCounts[role.id] || 0;
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onRoleChange(role.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#2672df] text-white shadow-xs font-semibold"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-border"
              }`}
            >
              <span>{role.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-white/25 text-white"
                    : "bg-surface-hover text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </ChipScrollRow>

      {/* 3. Dãy Chip chọn trạng thái */}
      <ChipScrollRow label="Trạng thái" icon={Filter}>
        {STATUS_LIST.map((st) => {
          const isSelected = selectedStatus === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onStatusChange(st.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-[#2672df] text-white shadow-xs font-semibold"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground border border-border"
              }`}
            >
              {st.label}
            </button>
          );
        })}
      </ChipScrollRow>
    </FilterBarContainer>
  );
}
