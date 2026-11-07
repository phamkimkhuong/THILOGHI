import {
  TractorFleetItem,
  TrailerFleetItem,
  DriverFleetItem,
  SaveTractorInput,
  SaveTrailerInput,
  SaveDriverInput,
} from "@/features/master-data/actions";

export type {
  TractorFleetItem,
  TrailerFleetItem,
  DriverFleetItem,
  SaveTractorInput,
  SaveTrailerInput,
  SaveDriverInput,
};

export interface FleetVendorOption {
  id: string;
  name: string;
  code?: string;
}

export type FleetActiveTab = "TRACTORS" | "TRAILERS" | "DRIVERS";

export type SelectedFleetItem =
  | { type: "TRACTOR"; data: TractorFleetItem }
  | { type: "TRAILER"; data: TrailerFleetItem }
  | { type: "DRIVER"; data: DriverFleetItem }
  | null;

/**
 * Phân loại hình thức sở hữu phương tiện:
 * - VTDB: Đội xe nội bộ THILOTRANS (Tổng công ty vận tải THILOGI)
 * - Khác: Nhà xe vệ tinh / Thầu phụ ngoài
 */
export function isInternalThilotrans(vendorId?: string): boolean {
  if (!vendorId) return false;
  const v = vendorId.trim().toUpperCase();
  return v === "VTDB" || v === "THILOTRANS";
}

export function getOwnershipBadge(vendorId?: string, vendorName?: string) {
  const isInternal = isInternalThilotrans(vendorId);
  if (isInternal) {
    return {
      label: "THILOTRANS (Nội bộ)",
      badgeClass:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    };
  }
  return {
    label: vendorName || vendorId || "Thầu phụ vệ tinh",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  };
}

export function getTransitRouteBadge(route?: string) {
  if (!route || route === "Unknown" || route === "Wait") {
    return {
      label: "Nội địa / Chưa gán tuyến",
      badgeClass: "bg-surface text-muted-foreground border-border",
    };
  }
  const r = route.toLowerCase();
  if (r.includes("cam") && r.includes("lào") && r.includes("việt")) {
    return {
      label: route,
      badgeClass:
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    };
  }
  if (r.includes("lào")) {
    return {
      label: route,
      badgeClass:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    };
  }
  if (r.includes("cam")) {
    return {
      label: route,
      badgeClass:
        "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
    };
  }
  return {
    label: route,
    badgeClass: "bg-surface text-foreground border-border",
  };
}

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
