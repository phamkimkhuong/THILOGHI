import type { getQuotationMasterDataAction } from "@/features/quotation/actions";

export type MasterData = Awaited<ReturnType<typeof getQuotationMasterDataAction>>;

export interface QuotationHeaderState {
  customerId: string;
  regionId: string;
  commodityId: string;
  paymentTermsDays: number;
  pricingDate?: string;
  validUntil?: string;
}

export const BLANK_HEADER: QuotationHeaderState = {
  customerId: "",
  regionId: "",
  commodityId: "",
  paymentTermsDays: 30,
  pricingDate: new Date().toISOString().split("T")[0],
  validUntil: "",
};

export interface FieldErrors {
  customerId?: string;
  regionId?: string;
  paymentTermsDays?: string;
  items?: Record<
    number,
    {
      originLocationId?: string;
      destinationLocationId?: string;
      equipmentType?: string;
      plannedQuantity?: string;
      unitSellPrice?: string;
    }
  >;
}

export const money = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n) + " ₫";

export const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 transition-colors";

export const panelClass =
  "rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4 shadow-xs";

