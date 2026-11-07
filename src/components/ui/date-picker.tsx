"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface DatePickerProps {
  value?: string; // ISO date string: YYYY-MM-DD
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
  ariaLabel?: string;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

function formatDisplayDate(isoDate?: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function toIsoString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Component DatePicker chuẩn hoá cho THILOGI ERP.
 * Hỗ trợ giao diện tiếng Việt, định dạng dd/MM/yyyy, Popover Radix và các preset chọn nhanh.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày…",
  disabled = false,
  className,
  minDate,
  maxDate,
  error,
  ariaLabel = "Chọn ngày",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse ngày đang chọn hoặc mặc định tháng hiện tại
  const parsedDate = React.useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [value]);

  const [navDate, setNavDate] = React.useState<Date | null>(null);
  const [prevValue, setPrevValue] = React.useState(value);

  // Điều chỉnh state trực tiếp trong render khi prop value đổi mà không cần useEffect (chuẩn React 19)
  if (value !== prevValue) {
    setPrevValue(value);
    setNavDate(null);
  }

  const viewDate = navDate ?? parsedDate ?? new Date();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Tạo các ngày trong tháng (bắt đầu từ Thứ 2)
  const daysInMonth = React.useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Thứ trong tuần: 0=CN, 1=T2, ..., 6=T7 -> chuyển sang 0=T2, ..., 6=CN
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days: (Date | null)[] = [];

    // Khoảng trống trước ngày đầu tháng
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Các ngày trong tháng
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }

    return days;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    setNavDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    const iso = toIsoString(date);
    onChange?.(iso);
    setOpen(false);
  };

  const handleQuickPreset = (offsetDays: number | "endOfMonth") => {
    const today = new Date();
    if (offsetDays === "endOfMonth") {
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      onChange?.(toIsoString(end));
    } else {
      const target = new Date(today);
      target.setDate(today.getDate() + offsetDays);
      onChange?.(toIsoString(target));
    }
    setOpen(false);
  };

  const isSelected = (date: Date) => {
    if (!parsedDate) return false;
    return (
      date.getDate() === parsedDate.getDate() &&
      date.getMonth() === parsedDate.getMonth() &&
      date.getFullYear() === parsedDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isDisabled = (date: Date) => {
    const iso = toIsoString(date);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  const displayText = formatDisplayDate(value);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors shadow-2xs hover:bg-surface-hover focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:ring-red-500 ring-1 ring-red-500/20",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className={displayText ? "font-mono font-medium" : "text-muted-foreground"}>
              {displayText || placeholder}
            </span>
          </span>
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Xóa ngày"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange?.("");
                }
              }}
              className="p-0.5 hover:bg-surface-active rounded text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-72 rounded-xl border border-border bg-surface p-3 text-foreground shadow-xl animate-in fade-in-50 zoom-in-95"
        >
          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2.5 mb-2.5 border-b border-border text-xs">
            <button
              type="button"
              onClick={() => handleQuickPreset(0)}
              className="px-2 py-0.5 rounded bg-blue-50 text-primary dark:bg-blue-950/60 dark:text-blue-300 font-medium hover:opacity-80 transition-opacity"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(7)}
              className="px-2 py-0.5 rounded bg-surface hover:bg-surface-hover border border-border font-medium text-muted-foreground hover:text-foreground"
            >
              +7 ngày
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(30)}
              className="px-2 py-0.5 rounded bg-surface hover:bg-surface-hover border border-border font-medium text-muted-foreground hover:text-foreground"
            >
              +30 ngày
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("endOfMonth")}
              className="px-2 py-0.5 rounded bg-surface hover:bg-surface-hover border border-border font-medium text-muted-foreground hover:text-foreground"
            >
              Cuối tháng
            </button>
          </div>

          {/* Month & Year header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold text-foreground">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground mb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="py-0.5">
                {wd}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {daysInMonth.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }

              const selected = isSelected(date);
              const today = isToday(date);
              const disabledDay = isDisabled(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDate(date)}
                  className={cn(
                    "h-8 rounded-lg font-mono text-xs transition-colors flex items-center justify-center",
                    selected
                      ? "bg-primary text-white font-bold shadow-xs"
                      : today
                      ? "border border-primary font-bold text-primary hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      : "hover:bg-surface-hover text-foreground",
                    disabledDay && "opacity-25 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
