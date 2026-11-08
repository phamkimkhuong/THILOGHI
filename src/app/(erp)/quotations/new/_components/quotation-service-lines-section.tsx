"use client";

import { Plus, Trash2, Layers, Search, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableContainer } from "@/components/ui/list-page";
import { CurrencyInput, QuantityInput } from "@/components/ui/currency-input";
import { FormError } from "@/components/ui/form";
import { cn } from "@/shared/utils/cn";
import { rateWarning } from "@/features/quotation/workspace-state";
import type { ServiceItemState } from "@/features/quotation/editor-state";
import { ChoiceSelect } from "./choice-select";
import { inputClass, money, panelClass, type FieldErrors, type MasterData } from "./types";

interface QuotationServiceLinesSectionProps {
  items: ServiceItemState[];
  active: number;
  setActive: (index: number) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (patch: Partial<ServiceItemState>, route?: boolean) => void;
  onLookup: () => void;
  master: MasterData | null;
  locked: boolean;
  busy: boolean;
  status: string;
  fieldErrors: FieldErrors;
}

export function QuotationServiceLinesSection({
  items,
  active,
  setActive,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onLookup,
  master,
  locked,
  busy,
  status,
  fieldErrors,
}: QuotationServiceLinesSectionProps) {
  const item = items[active];
  const activeItemErrors = fieldErrors.items?.[active];

  return (
    <section className={panelClass}>
      {/* Header Dòng dịch vụ */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-500/10 text-primary border border-blue-200 dark:border-blue-900">
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">
              2. Các tuyến &amp; dòng dịch vụ vận tải ({items.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Bấm vào từng số dòng để xem chi tiết và cấu hình giá cước.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={locked || items.length >= 200}
          onClick={onAddItem}
          className="flex items-center gap-1.5 font-semibold shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm tuyến / dịch vụ
        </Button>
      </div>

      {/* Bảng tóm tắt các dòng dịch vụ */}
      <TableContainer ariaLabel="Bảng danh sách các dòng dịch vụ">
        <table className="erp-table w-full text-left text-xs">
          <thead>
            <tr>
              <th className="w-16 text-center">Dòng</th>
              <th className="w-28">Gói dịch vụ</th>
              <th>Lộ trình (Điểm đi → Điểm đến)</th>
              <th className="text-center">Số lượng</th>
              <th className="text-right">Giá mua / Đơn vị</th>
              <th className="text-right">Giá bán / Đơn vị</th>
              <th className="w-12 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x, i) => {
              const hasItemErr =
                !!fieldErrors.items?.[i] && Object.keys(fieldErrors.items[i]).length > 0;
              const isSelected = active === i;
              const originName =
                master?.locations.find((l) => l.id === x.originLocationId)?.name ??
                x.originLocationId ??
                "";
              const destName =
                master?.locations.find((l) => l.id === x.destinationLocationId)?.name ??
                x.destinationLocationId ??
                "";
              const warningText = status === "DRAFT" ? rateWarning(x) : "";

              return (
                <tr
                  key={x.id}
                  onClick={() => setActive(i)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40 font-medium"
                      : "hover:bg-surface-hover"
                  )}
                >
                  <td className="text-center">
                    <button
                      type="button"
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-colors",
                        isSelected
                          ? "bg-primary text-white shadow-xs"
                          : "bg-surface border border-border text-foreground hover:bg-surface-hover",
                        hasItemErr && "!border-red-500 !text-red-600 !bg-red-50 dark:!bg-red-950/30"
                      )}
                      disabled={busy}
                      aria-pressed={isSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActive(i);
                      }}
                    >
                      #{i + 1}
                      {hasItemErr ? " (!)" : ""}
                    </button>
                  </td>

                  <td>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-primary dark:bg-blue-950 dark:text-blue-300">
                      {x.servicePackage || "TRUCKING"}
                    </span>
                  </td>

                  <td>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span>{originName || "Chưa chọn điểm đi"}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>{destName || "Chưa chọn điểm đến"}</span>
                    </div>
                    {warningText && (
                      <span className="block text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        {warningText}
                      </span>
                    )}
                  </td>

                  <td className="text-center font-mono">
                    {x.plannedQuantity} <span className="text-muted-foreground">{x.unit}</span>
                  </td>

                  <td className="text-right font-mono font-medium text-emerald-700 dark:text-emerald-400">
                    {x.selectedBuyRateId ? money(x.unitBuyPrice) : (
                      <span className="text-muted-foreground italic font-normal">Chưa chọn</span>
                    )}
                  </td>

                  <td className="text-right font-mono font-bold text-foreground">
                    {money(x.unitSellPrice)}
                  </td>

                  <td className="text-center">
                    <button
                      type="button"
                      className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Xóa dòng ${i + 1}`}
                      disabled={locked || items.length <= 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(i);
                      }}
                      title="Xóa tuyến dịch vụ này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>

      {/* Form chi tiết dòng dịch vụ đang chọn */}
      {item && (
        <fieldset
          disabled={locked}
          className="rounded-xl border border-border/80 bg-background/50 p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>Cấu hình chi tiết Tuyến #{active + 1}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-primary dark:bg-blue-950 dark:text-blue-300 font-mono text-[11px] normal-case">
                {item.servicePackage === "TRUCKING" ? "Vận tải đường bộ" : item.servicePackage}
              </span>
            </h3>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Gói dịch vụ */}
            <div className="space-y-1.5 font-sans">
              <label className="block text-xs font-semibold text-foreground">
                Gói dịch vụ thương mại <span className="text-red-500">*</span>
                <select
                  disabled={locked}
                  className={cn(inputClass, "mt-1 font-semibold")}
                  value={item.servicePackage || "TRUCKING"}
                  onChange={(e) => {
                    const selectedPkg = master?.services?.find((s) => s.serviceId === e.target.value);
                    onUpdateItem({
                      servicePackage: e.target.value,
                      unit: selectedPkg?.defaultUnit || item.unit,
                    });
                  }}
                >
                  {(master?.services && master.services.length > 0
                    ? master.services
                    : [
                        { serviceId: "TRUCKING", serviceName: "Vận tải đường bộ" },
                        { serviceId: "OCEAN", serviceName: "Vận tải biển" },
                        { serviceId: "PORT", serviceName: "Cảng & Depot" },
                        { serviceId: "CUSTOMS", serviceName: "Hải quan & XNK" },
                        { serviceId: "BORDER_GATE", serviceName: "Cửa khẩu & Bãi kiểm hóa" },
                        { serviceId: "WAREHOUSING", serviceName: "Kho bãi & Lưu trữ" },
                        { serviceId: "INSURANCE", serviceName: "Bảo hiểm hàng hóa" },
                        { serviceId: "OTHER", serviceName: "Dịch vụ khác có kiểm soát" },
                      ]
                  ).map((s) => (
                    <option key={s.serviceId} value={s.serviceId}>
                      [{s.serviceId}] {s.serviceName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Điểm đi */}
            <ChoiceSelect
              label="Điểm đi (Origin)"
              required
              value={item.originLocationId}
              options={master?.locations ?? []}
              disabled={locked}
              error={activeItemErrors?.originLocationId}
              onChange={(v) => onUpdateItem({ originLocationId: v }, true)}
            />

            {/* Điểm đến */}
            <ChoiceSelect
              label="Điểm đến (Destination)"
              required
              value={item.destinationLocationId}
              options={master?.locations ?? []}
              disabled={locked}
              error={activeItemErrors?.destinationLocationId}
              onChange={(v) => onUpdateItem({ destinationLocationId: v }, true)}
            />

            {/* Thiết bị */}
            <ChoiceSelect
              label="Loại phương tiện / Container"
              required
              value={item.equipmentType}
              options={master?.equipmentTypes ?? []}
              disabled={locked}
              error={activeItemErrors?.equipmentType}
              onChange={(v) => onUpdateItem({ equipmentType: v }, true)}
            />

            {/* Cách tính phí */}
            <div className="space-y-1.5 font-sans">
              <label className="block text-xs font-semibold text-foreground">
                Quy cách tính cước
                <select
                  className={cn(inputClass, "mt-1")}
                  value={item.pricingInclusion}
                  onChange={(e) =>
                    onUpdateItem({
                      pricingInclusion: e.target.value as ServiceItemState["pricingInclusion"],
                    })
                  }
                >
                  <option value="INCLUDED">Trong giá chào (All-in)</option>
                  <option value="SEPARATELY_BILLED">Thu riêng (Tách dòng)</option>
                  <option value="PASS_THROUGH_ACTUAL">Thu theo thực tế (Tạm tính)</option>
                </select>
              </label>
            </div>

            {/* Số lượng */}
            <div className="space-y-1.5 font-sans">
              <label className="block text-xs font-semibold text-foreground">
                <span
                  className={
                    activeItemErrors?.plannedQuantity
                      ? "text-red-600 dark:text-red-400 font-bold"
                      : ""
                  }
                >
                  Số lượng dự kiến <span className="text-red-500">*</span>
                </span>
                <div className="mt-1">
                  <QuantityInput
                    disabled={locked}
                    value={item.plannedQuantity}
                    className={
                      activeItemErrors?.plannedQuantity
                        ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20"
                        : ""
                    }
                    onValueChange={(v) => onUpdateItem({ plannedQuantity: v ?? 1 })}
                  />
                </div>
              </label>
              <FormError message={activeItemErrors?.plannedQuantity} />
            </div>

            {/* Đơn vị tính */}
            <div className="space-y-1.5 font-sans">
              <label className="block text-xs font-semibold text-foreground">
                Đơn vị tính
                <input
                  className={cn(inputClass, "mt-1 font-mono text-xs")}
                  maxLength={20}
                  value={item.unit}
                  onChange={(e) => onUpdateItem({ unit: e.target.value })}
                />
              </label>
            </div>

            {/* Đơn giá bán */}
            <div className="space-y-1.5 font-sans sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-foreground">
                <span
                  className={
                    activeItemErrors?.unitSellPrice
                      ? "text-red-600 dark:text-red-400 font-bold"
                      : ""
                  }
                >
                  Đơn giá bán khách hàng (VND / Đơn vị) <span className="text-red-500">*</span>
                </span>
                <div className="mt-1">
                  <CurrencyInput
                    disabled={locked}
                    value={item.unitSellPrice}
                    className={
                      activeItemErrors?.unitSellPrice
                        ? "border-red-500 focus:border-red-500 ring-1 ring-red-500/20 text-base"
                        : "text-base font-bold text-foreground"
                    }
                    onValueChange={(v) => onUpdateItem({ unitSellPrice: v ?? 0 })}
                  />
                </div>
              </label>
              <FormError message={activeItemErrors?.unitSellPrice} />
            </div>
          </div>

          {/* Nút Tra và so sánh giá NCC / Biểu phí Cảng */}
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={busy}
              onClick={onLookup}
              className="flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              {item.servicePackage === "PORT"
                ? "Tra cứu biểu phí Cảng Chu Lai"
                : item.servicePackage === "BORDER_GATE"
                ? "Tra cứu biểu phí Cửa khẩu"
                : item.servicePackage === "OCEAN"
                ? "Tra cứu cước Vận tải biển"
                : "Tra và so sánh giá mua NCC"}
            </Button>
          </div>
        </fieldset>
      )}

      {/* Nhà xe / Đơn vị cung cấp đã chọn cho dòng này */}
      {item?.selectedCandidate && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 text-xs text-foreground flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              {item.servicePackage === "PORT"
                ? "Biểu phí cảng đã chọn: "
                : item.servicePackage === "BORDER_GATE"
                ? "Biểu phí cửa khẩu đã chọn: "
                : item.servicePackage === "OCEAN"
                ? "Cước hãng tàu đã chọn: "
                : "Nhà cung cấp đã chọn: "}
              <strong className="text-emerald-900 dark:text-emerald-200">
                {item.selectedCandidate.vendorName}
              </strong>{" "}
              · Đơn giá quy đổi:{" "}
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {money(item.unitBuyPrice)}
              </span>{" "}
              / {item.unit}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              Giá gốc: {item.selectedCandidate.buyRate.toLocaleString("vi-VN")}{" "}
              {item.selectedCandidate.currency} · Hiệu lực: {item.selectedCandidate.validityStart} →{" "}
              {item.selectedCandidate.validityEnd}
            </p>
          </div>
        </div>
      )}

      {/* Bảng so sánh các nhà xe / biểu phí cảng / cửa khẩu / hãng tàu khả dụng */}
      {!!item?.lookupResult?.candidates.length && (
        <div className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              {item.servicePackage === "PORT"
                ? "Danh sách biểu phí Cảng Chu Lai khả dụng (quy đổi VND). Bấm \"Áp dụng\" để đưa vào giá vốn báo giá."
                : item.servicePackage === "BORDER_GATE"
                ? "Danh sách biểu phí Cửa khẩu khả dụng (quy đổi VND). Bấm \"Áp dụng\" để đưa vào giá vốn báo giá."
                : item.servicePackage === "OCEAN"
                ? "Danh sách biểu cước hãng tàu khả dụng (quy đổi VND). Bấm \"Áp dụng\" để đưa vào giá vốn báo giá."
                : "So sánh các nhà cung cấp khả dụng (quy đổi VND). Bấm \"Chọn NCC\" để áp giá vào báo giá."}
            </span>
          </p>
          <TableContainer ariaLabel="Bảng so sánh nhà cung cấp và biểu phí">
            <table className="erp-table w-full text-xs">
              <thead>
                <tr>
                  <th>
                    {item.servicePackage === "PORT"
                      ? "Tác nghiệp & Cảng"
                      : item.servicePackage === "BORDER_GATE"
                      ? "Cặp cửa khẩu & Mặt hàng"
                      : item.servicePackage === "OCEAN"
                      ? "Hãng tàu & Tuyến cảng"
                      : "Nhà cung cấp"}
                  </th>
                  <th className="text-right">Đơn giá gốc</th>
                  <th className="text-center">Tỷ giá</th>
                  <th className="text-right">Quy đổi VND</th>
                  <th className="text-center">Thời hạn hiệu lực</th>
                  <th className="w-24 text-right">Lựa chọn</th>
                </tr>
              </thead>
              <tbody>
                {item.lookupResult.candidates.map((candidate) => {
                  const isChosen = item.selectedBuyRateId === candidate.rateId;
                  return (
                    <tr
                      key={candidate.rateId}
                      className={isChosen ? "bg-emerald-50/70 dark:bg-emerald-950/30" : ""}
                    >
                      <td className="font-semibold text-foreground">{candidate.vendorName}</td>
                      <td className="text-right font-mono">
                        {candidate.buyRate.toLocaleString("vi-VN")} {candidate.currency}
                      </td>
                      <td className="text-center font-mono text-muted-foreground">
                        {candidate.fxRateToVnd}
                      </td>
                      <td className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {money(candidate.buyRateVnd)}
                      </td>
                      <td className="text-center font-mono text-[11px] text-muted-foreground">
                        {candidate.validityStart} → {candidate.validityEnd}
                      </td>
                      <td className="text-right">
                        <Button
                          type="button"
                          variant={isChosen ? "primary" : "outline"}
                          size="sm"
                          disabled={
                            locked ||
                            ["ERROR", "CONFLICT_RATE"].includes(item.lookupResult!.status)
                          }
                          onClick={() =>
                            onUpdateItem({
                              selectedCandidate: candidate,
                              selectedBuyRateId: candidate.rateId,
                              unitBuyPrice: candidate.buyRateVnd,
                            })
                          }
                          className="h-7 text-xs px-2.5"
                        >
                          {isChosen ? "Đã chọn" : item.servicePackage === "PORT" ? "Áp dụng" : "Chọn NCC"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableContainer>
        </div>
      )}
    </section>
  );
}

