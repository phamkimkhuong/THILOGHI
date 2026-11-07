"use client";

import { Navigation, RotateCcw } from "lucide-react";

interface RatesRouteMatcherProps {
  origin: string;
  onOriginChange: (val: string) => void;
  dest: string;
  onDestChange: (val: string) => void;
  equipment: string;
  onEquipmentChange: (val: string) => void;
  uniqueOrigins: Array<{ id: string; name: string }>;
  uniqueDestinations: Array<{ id: string; name: string }>;
  uniqueEquipments: string[];
  onReset: () => void;
}

export function RatesRouteMatcher({
  origin,
  onOriginChange,
  dest,
  onDestChange,
  equipment,
  onEquipmentChange,
  uniqueOrigins,
  uniqueDestinations,
  uniqueEquipments,
  onReset,
}: RatesRouteMatcherProps) {
  const isFiltering = origin !== "ALL" || dest !== "ALL" || equipment !== "ALL";

  return (
    <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
          Lọc tuyến cước nhanh
        </span>
        {isFiltering && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
            title="Đặt lại bộ lọc tuyến"
          >
            <RotateCcw className="w-3 h-3" /> Đặt lại tuyến
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Điểm Nhận / Xếp Hàng */}
        <div>
          <label htmlFor="matcher-origin" className="text-xs text-muted-foreground block mb-1 font-medium">
            Điểm Nhận / Xếp Hàng (Origin)
          </label>
          <select
            id="matcher-origin"
            aria-label="Điểm xếp"
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          >
            <option value="ALL">-- Tất Cả Điểm Đi ({uniqueOrigins.length}) --</option>
            {uniqueOrigins.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        {/* Điểm Giao / Dỡ Hàng */}
        <div>
          <label htmlFor="matcher-dest" className="text-xs text-muted-foreground block mb-1 font-medium">
            Điểm Giao / Dỡ Hàng (Destination)
          </label>
          <select
            id="matcher-dest"
            aria-label="Điểm dỡ"
            value={dest}
            onChange={(e) => onDestChange(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          >
            <option value="ALL">-- Tất Cả Điểm Đến ({uniqueDestinations.length}) --</option>
            {uniqueDestinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Thiết bị / Loại xe */}
        <div>
          <label htmlFor="matcher-equipment" className="text-xs text-muted-foreground block mb-1 font-medium">
            Thiết bị / Cont
          </label>
          <select
            id="matcher-equipment"
            aria-label="Thiết bị"
            value={equipment}
            onChange={(e) => onEquipmentChange(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          >
            <option value="ALL">-- Tất Cả Thiết Bị ({uniqueEquipments.length}) --</option>
            {uniqueEquipments.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

