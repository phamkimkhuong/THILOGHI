"use client";

import { Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { calculateQuotationFinancials } from "@/shared/utils/pricing";
import { money } from "./types";

interface QuotationMobileActionBarProps {
  totals: ReturnType<typeof calculateQuotationFinancials>;
  status: string;
  canEdit: boolean;
  locked: boolean;
  busy: boolean;
  onSave: (submit: boolean) => void;
}

export function QuotationMobileActionBar({
  totals,
  status,
  canEdit,
  locked,
  busy,
  onSave,
}: QuotationMobileActionBarProps) {
  if (status !== "DRAFT" || !canEdit) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface/95 backdrop-blur-md border-t border-border p-3 shadow-2xl font-sans">
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        <div className="space-y-0.5 min-w-0">
          <div className="text-[11px] text-muted-foreground">Tổng doanh thu</div>
          <div className="font-mono text-sm font-bold text-foreground truncate">
            {money(totals.totalSellAmount)}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Margin: {totals.estimatedMarginPercent.toFixed(1)}%
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={locked}
            loading={busy}
            onClick={() => onSave(false)}
            className="h-8 text-xs px-2.5 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" /> Lưu nháp
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={locked}
            loading={busy}
            onClick={() => onSave(true)}
            className="h-8 text-xs px-3 font-bold shadow-xs"
          >
            <Send className="w-3.5 h-3.5" /> Gửi duyệt
          </Button>
        </div>
      </div>
    </div>
  );
}

