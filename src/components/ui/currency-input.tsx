"use client";

import * as React from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { cn } from "@/shared/utils/cn";

export interface CurrencyInputProps
  extends Omit<NumericFormatProps, "value" | "onValueChange"> {
  value?: number | string | null;
  onValueChange?: (value: number | undefined) => void;
  currencySuffix?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Input định dạng tiền tệ chuyên dụng cho Logistics THILOGI.
 * Tự động thêm dấu chấm phân cách hàng nghìn (ví dụ: 15.000.000 ₫).
 * Trả về giá trị số (number) thuần qua callback onValueChange.
 */
export function CurrencyInput({
  value,
  onValueChange,
  currencySuffix = " ₫",
  className,
  disabled,
  placeholder = "0 ₫",
  ...props
}: CurrencyInputProps) {
  return (
    <NumericFormat
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={0}
      allowNegative={false}
      suffix={currencySuffix}
      value={value ?? ""}
      disabled={disabled}
      placeholder={placeholder}
      onValueChange={(values) => {
        onValueChange?.(values.floatValue);
      }}
      className={cn(
        "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground font-mono transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs text-right",
        className
      )}
      {...props}
    />
  );
}

export interface QuantityInputProps
  extends Omit<NumericFormatProps, "value" | "onValueChange"> {
  value?: number | string | null;
  onValueChange?: (value: number | undefined) => void;
  suffix?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Input định dạng số lượng hàng hóa / trọng tải (Tấn, Cbm, Container).
 * Cho phép tối đa 2 chữ số thập phân (ví dụ: 25,5 Tấn).
 */
export function QuantityInput({
  value,
  onValueChange,
  suffix,
  className,
  disabled,
  placeholder = "0",
  ...props
}: QuantityInputProps) {
  return (
    <NumericFormat
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      allowNegative={false}
      suffix={suffix ? ` ${suffix}` : undefined}
      value={value ?? ""}
      disabled={disabled}
      placeholder={placeholder}
      onValueChange={(values) => {
        onValueChange?.(values.floatValue);
      }}
      className={cn(
        "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground font-mono transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs text-right",
        className
      )}
      {...props}
    />
  );
}

