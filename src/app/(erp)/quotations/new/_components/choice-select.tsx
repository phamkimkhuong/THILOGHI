"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { FormError } from "@/components/ui/form";
import type { MasterOption } from "@/server/modules/master-data/master-data.service";
import { inputClass } from "./types";

interface ChoiceSelectProps {
  label: string;
  value: string;
  options: MasterOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export function ChoiceSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  error,
  required = false,
}: ChoiceSelectProps) {
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) =>
    `${o.name} ${o.code ?? ""} ${o.id}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase())
  );

  const current = options.find((o) => o.id === value);

  return (
    <div className="space-y-1.5 font-sans">
      <label className="block text-xs font-semibold text-foreground">
        <span className={error ? "text-red-600 dark:text-red-400 font-bold" : ""}>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        <select
          aria-label={label}
          className={cn(
            inputClass,
            "mt-1",
            error && "border-red-500 focus:ring-red-500 ring-1 ring-red-500/20"
          )}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">-- Chọn {label.toLowerCase()} --</option>
          {value && !filtered.some((o) => o.id === value) && (
            <option value={value}>
              {current?.name ?? `${value} (không có trong danh mục hoạt động)`}
            </option>
          )}
          {filtered.slice(0, 100).map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {o.code ? ` · ${o.code}` : ""}
            </option>
          ))}
        </select>
      </label>

      {!disabled && options.length > 15 && (
        <div className="relative">
          <input
            aria-label={`Tìm ${label.toLowerCase()}`}
            className={cn(inputClass, "pl-8 text-xs py-1.5")}
            placeholder={`Tìm nhanh theo mã / tên...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      )}

      {!disabled && filtered.length > 100 && (
        <p className="text-[11px] text-muted-foreground">
          Đang hiển thị 100 kết quả đầu; nhập từ khóa để lọc thêm.
        </p>
      )}

      <FormError message={error} />
    </div>
  );
}

