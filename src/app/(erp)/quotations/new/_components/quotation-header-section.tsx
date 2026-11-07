"use client";

import { Building2, CalendarClock } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { FormError } from "@/components/ui/form";
import { ChoiceSelect } from "./choice-select";
import { inputClass, panelClass, type FieldErrors, type MasterData, type QuotationHeaderState } from "./types";

interface QuotationHeaderSectionProps {
  header: QuotationHeaderState;
  onHeaderChange: React.Dispatch<React.SetStateAction<QuotationHeaderState>>;
  master: MasterData | null;
  locked: boolean;
  fieldErrors: FieldErrors;
  onClearFieldError: (field: keyof FieldErrors) => void;
}

export function QuotationHeaderSection({
  header,
  onHeaderChange,
  master,
  locked,
  fieldErrors,
  onClearFieldError,
}: QuotationHeaderSectionProps) {
  return (
    <section className={panelClass}>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="p-1.5 rounded-lg bg-blue-500/10 text-primary border border-blue-200 dark:border-blue-900">
          <Building2 className="w-4 h-4" />
        </span>
        <h2 className="text-base font-bold text-foreground">1. Thông tin chung hồ sơ báo giá</h2>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Khách hàng */}
        <ChoiceSelect
          label="Khách hàng đối tác"
          required
          value={header.customerId}
          options={master?.customers ?? []}
          disabled={locked}
          error={fieldErrors.customerId}
          onChange={(v) => {
            onHeaderChange((h) => ({ ...h, customerId: v }));
            onClearFieldError("customerId");
          }}
        />

        {/* Vùng phụ trách */}
        <ChoiceSelect
          label="Phân vùng phụ trách"
          required
          value={header.regionId}
          options={master?.regions ?? []}
          disabled={locked}
          error={fieldErrors.regionId}
          onChange={(v) => {
            onHeaderChange((h) => ({ ...h, regionId: v }));
            onClearFieldError("regionId");
          }}
        />

        {/* Hàng hóa */}
        <ChoiceSelect
          label="Mặt hàng (tùy chọn)"
          value={header.commodityId}
          options={master?.commodities ?? []}
          disabled={locked}
          onChange={(v) => onHeaderChange((h) => ({ ...h, commodityId: v }))}
        />

        {/* Hạn thanh toán */}
        <div className="space-y-1.5 font-sans">
          <label className="block text-xs font-semibold text-foreground">
            <span
              className={
                fieldErrors.paymentTermsDays ? "text-red-600 dark:text-red-400 font-bold" : ""
              }
            >
              Hạn thanh toán (ngày)
            </span>
            <div className="relative mt-1">
              <input
                className={cn(
                  inputClass,
                  "pl-8",
                  fieldErrors.paymentTermsDays &&
                    "border-red-500 focus:ring-red-500 ring-1 ring-red-500/20"
                )}
                type="number"
                min={0}
                max={3650}
                step={1}
                disabled={locked}
                value={header.paymentTermsDays}
                onChange={(e) => {
                  onHeaderChange((h) => ({ ...h, paymentTermsDays: Number(e.target.value) }));
                  onClearFieldError("paymentTermsDays");
                }}
              />
              <CalendarClock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </label>
          <FormError message={fieldErrors.paymentTermsDays} />
        </div>
      </div>
    </section>
  );
}

