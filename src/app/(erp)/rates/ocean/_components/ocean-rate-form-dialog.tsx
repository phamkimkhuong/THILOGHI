"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Ship, DollarSign, Calculator, Anchor, ArrowRight } from "lucide-react";
import {
  OceanRateItem,
  SaveOceanRateInput,
  CONTAINER_TYPE_OPTIONS,
  STANDARD_COMMODITIES,
  formatCurrency,
  formatUsd,
} from "./types";
import { saveOceanRateAction } from "@/features/master-data/actions";
import { OCEAN_FX_RATE_USD_VND } from "@/server/modules/supplier-pricing/ocean-rates.service";

interface OceanRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: OceanRateItem | null;
  carrierOptions: { carrierId: string; carrierName: string }[];
  portOptions: { portId: string; portName: string; countryCode: string }[];
  onSuccess: () => void;
}

function getInitialForm(
  rate: OceanRateItem | null,
  carrierOptions: { carrierId: string; carrierName: string }[],
  portOptions: { portId: string; portName: string; countryCode: string }[]
): SaveOceanRateInput {
  if (rate) {
    return {
      rateId: rate.rateId,
      carrierId: rate.carrierId,
      carrierName: rate.carrierName,
      polId: rate.polId,
      polName: rate.polName,
      podId: rate.podId,
      podName: rate.podName,
      commodityName: rate.commodityName || "Quả chuối tươi",
      containerType: rate.containerType || "40HR",
      oceanFreightUsd: rate.oceanFreightUsd ?? 0,
      thcFee: rate.thcFee ?? 0,
      docsFee: rate.docsFee ?? 0,
      sealFee: rate.sealFee ?? 0,
      afsFee: rate.afsFee ?? 0,
      telexFee: rate.telexFee ?? 0,
      bafCafFee: rate.bafCafFee ?? 0,
      otherSurcharges: rate.otherSurcharges ?? 0,
      currency: "USD",
      validFrom: rate.validFrom || "2026-01-01",
      validTo: rate.validTo || "2026-12-31",
      status: rate.status || "ACTIVE",
      notes: rate.notes || "",
    };
  }

  const defaultCarrier = carrierOptions[0] || { carrierId: "SITC", carrierName: "SITC Maritime Group" };
  const defaultPol = portOptions.find((p) => p.portId === "VNTAP") || portOptions[0] || {
    portId: "VNTAP",
    portName: "CHU LAI PORT",
    countryCode: "VN",
  };
  const defaultPod = portOptions.find((p) => p.portId === "CNDLC") || portOptions[1] || {
    portId: "CNDLC",
    portName: "DALIAN PORT",
    countryCode: "CN",
  };

  return {
    carrierId: defaultCarrier.carrierId,
    carrierName: defaultCarrier.carrierName,
    polId: defaultPol.portId,
    polName: defaultPol.portName,
    podId: defaultPod.portId,
    podName: defaultPod.portName,
    commodityName: "Quả chuối tươi",
    containerType: "40HR",
    oceanFreightUsd: 700,
    thcFee: 0,
    docsFee: 950000,
    sealFee: 190000,
    afsFee: 665000,
    telexFee: 570000,
    bafCafFee: 0,
    otherSurcharges: 0,
    currency: "USD",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "",
  };
}

export function OceanRateFormDialog({
  open,
  onOpenChange,
  rate,
  carrierOptions,
  portOptions,
  onSuccess,
}: OceanRateFormDialogProps) {
  if (!open) return null;

  const instanceKey = rate ? rate.rateId : "new";

  return (
    <OceanRateFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      rate={rate}
      carrierOptions={carrierOptions}
      portOptions={portOptions}
      onSuccess={onSuccess}
    />
  );
}

function OceanRateFormDialogContent({
  open,
  onOpenChange,
  rate,
  carrierOptions,
  portOptions,
  onSuccess,
}: OceanRateFormDialogProps) {
  const [form, setForm] = useState<SaveOceanRateInput>(() =>
    getInitialForm(rate, carrierOptions, portOptions)
  );
  const isEditing = Boolean(rate);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tính tổng chi phí quy đổi VND theo thời gian thực
  const oceanFreightVnd = Number(form.oceanFreightUsd || 0) * (OCEAN_FX_RATE_USD_VND || 25700);
  const localChargesVnd =
    Number(form.docsFee || 0) +
    Number(form.sealFee || 0) +
    Number(form.afsFee || 0) +
    Number(form.telexFee || 0) +
    Number(form.thcFee || 0) +
    Number(form.bafCafFee || 0) +
    Number(form.otherSurcharges || 0);

  const totalChargesVnd = oceanFreightVnd + localChargesVnd;

  const handleCarrierChange = (carrierId: string) => {
    const c = carrierOptions.find((x) => x.carrierId === carrierId);
    setForm((prev) => ({
      ...prev,
      carrierId,
      carrierName: c?.carrierName || carrierId,
    }));
    if (errors.carrierId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.carrierId;
        return next;
      });
    }
  };

  const handlePolChange = (polId: string) => {
    const p = portOptions.find((x) => x.portId === polId);
    setForm((prev) => ({
      ...prev,
      polId,
      polName: p?.portName || polId,
    }));
    if (errors.polId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.polId;
        return next;
      });
    }
  };

  const handlePodChange = (podId: string) => {
    const p = portOptions.find((x) => x.portId === podId);
    setForm((prev) => ({
      ...prev,
      podId,
      podName: p?.portName || podId,
    }));
    if (errors.podId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.podId;
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.carrierId?.trim()) {
      newErrors.carrierId = "Vui lòng chọn hãng tàu vận tải biển.";
    }
    if (!form.polId?.trim()) {
      newErrors.polId = "Vui lòng chọn cảng đi (POL).";
    }
    if (!form.podId?.trim()) {
      newErrors.podId = "Vui lòng chọn cảng đến (POD).";
    }
    if (form.polId && form.podId && form.polId === form.podId) {
      newErrors.podId = "Cảng đến không được trùng với cảng đi.";
    }
    if (!form.commodityName?.trim()) {
      newErrors.commodityName = "Vui lòng nhập tên mặt hàng.";
    }
    if (!form.containerType?.trim()) {
      newErrors.containerType = "Vui lòng chọn loại container.";
    }
    if (form.oceanFreightUsd < 0) {
      newErrors.oceanFreightUsd = "Cước biển USD không được là số âm.";
    }
    if (!form.validFrom) {
      newErrors.validFrom = "Vui lòng chọn ngày bắt đầu hiệu lực.";
    }
    if (!form.validTo) {
      newErrors.validTo = "Vui lòng chọn ngày kết thúc hiệu lực.";
    }
    if (form.validFrom && form.validTo && form.validFrom > form.validTo) {
      newErrors.validTo = "Ngày kết thúc phải sau ngày bắt đầu.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng hoàn thiện các trường dữ liệu theo quy định.");
      return;
    }

    setSaving(true);
    try {
      const res = await saveOceanRateAction(form);
      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Lỗi lưu biểu cước vận tải biển.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi không mong muốn khi lưu dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Chỉnh sửa biểu cước Vận tải biển" : "Thêm mới biểu cước Vận tải biển"}
      description={
        isEditing
          ? `Cập nhật thông tin chi phí mua đầu vào cho tuyến [${form.polName} -> ${form.podName}] hãng tàu ${form.carrierName}.`
          : "Định cấu hình cước biển O/F (USD) và phụ phí Local Charges (VND) cho các tuyến vận tải biển quốc tế và feeder."
      }
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
        {/* Banner Tổng chi phí mua quy đổi theo thời gian thực */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-primary border border-blue-200 dark:border-blue-800">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                Tổng giá mua quy đổi dự toán (Total Ocean Buy)
              </div>
              <div className="text-xl font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(totalChargesVnd)}
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground font-mono space-y-0.5 sm:border-l sm:border-border/60 sm:pl-3">
            <div>
              Cước biển: <span className="font-bold text-blue-600">{formatUsd(form.oceanFreightUsd)}</span> (&asymp; {formatCurrency(oceanFreightVnd)})
            </div>
            <div>
              Phụ phí Local: <span className="font-bold text-foreground">{formatCurrency(localChargesVnd)}</span>
            </div>
          </div>
        </div>

        {/* Khối 1: Hãng tàu & Tuyến cảng */}
        <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-blue-600" /> 1. Hãng tàu &amp; Tuyến vận tải biển
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Hãng tàu */}
            <div>
              <label htmlFor="carrier-select" className="block font-medium text-foreground mb-1">
                Hãng tàu vận tải *
              </label>
              <select
                id="carrier-select"
                value={form.carrierId}
                onChange={(e) => handleCarrierChange(e.target.value)}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.carrierId ? "border-red-500" : "border-border"
                }`}
              >
                {carrierOptions.map((c) => (
                  <option key={c.carrierId} value={c.carrierId}>
                    {c.carrierId} – {c.carrierName}
                  </option>
                ))}
              </select>
              {errors.carrierId && <p className="text-[11px] text-red-500 mt-0.5">{errors.carrierId}</p>}
            </div>

            {/* Cảng đi (POL) */}
            <div>
              <label htmlFor="pol-select" className="block font-medium text-foreground mb-1 flex items-center gap-1">
                <Anchor className="w-3 h-3 text-blue-600" /> Cảng bốc hàng (POL) *
              </label>
              <select
                id="pol-select"
                value={form.polId}
                onChange={(e) => handlePolChange(e.target.value)}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.polId ? "border-red-500" : "border-border"
                }`}
              >
                {portOptions.map((p) => (
                  <option key={p.portId} value={p.portId}>
                    {p.portName} ({p.portId})
                  </option>
                ))}
              </select>
              {errors.polId && <p className="text-[11px] text-red-500 mt-0.5">{errors.polId}</p>}
            </div>

            {/* Cảng đến (POD) */}
            <div>
              <label htmlFor="pod-select" className="block font-medium text-foreground mb-1 flex items-center gap-1">
                <Anchor className="w-3 h-3 text-emerald-600" /> Cảng dỡ hàng (POD) *
              </label>
              <select
                id="pod-select"
                value={form.podId}
                onChange={(e) => handlePodChange(e.target.value)}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.podId ? "border-red-500" : "border-border"
                }`}
              >
                {portOptions.map((p) => (
                  <option key={p.portId} value={p.portId}>
                    {p.portName} ({p.portId})
                  </option>
                ))}
              </select>
              {errors.podId && <p className="text-[11px] text-red-500 mt-0.5">{errors.podId}</p>}
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 text-muted-foreground flex items-center gap-1.5 font-medium">
            <span>Tuyến hành trình:</span>
            <span className="text-blue-700 dark:text-blue-400 font-bold">{form.polName}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{form.podName}</span>
          </div>
        </div>

        {/* Khối 2: Loại Container & Mặt hàng */}
        <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-primary" /> 2. Loại Container &amp; Mặt hàng áp dụng
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Loại cont */}
            <div>
              <label htmlFor="container-type-select" className="block font-medium text-foreground mb-1">
                Loại Container *
              </label>
              <select
                id="container-type-select"
                value={form.containerType}
                onChange={(e) => setForm((prev) => ({ ...prev, containerType: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CONTAINER_TYPE_OPTIONS.filter((c) => c.id !== "ALL").map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mặt hàng */}
            <div>
              <label htmlFor="commodity-input" className="block font-medium text-foreground mb-1">
                Mặt hàng áp dụng *
              </label>
              <input
                id="commodity-input"
                type="text"
                list="commodities-list"
                value={form.commodityName}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, commodityName: e.target.value }));
                  if (errors.commodityName) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.commodityName;
                      return next;
                    });
                  }
                }}
                placeholder="VD: Quả chuối tươi, Thủy sản..."
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.commodityName ? "border-red-500" : "border-border"
                }`}
              />
              <datalist id="commodities-list">
                {STANDARD_COMMODITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.commodityName && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.commodityName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Khối 3: Bóc tách Chi phí Cước biển (O/F USD) và Local Charges (VND) */}
        <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-primary" /> 3. Chi phí Cước biển &amp; Phụ phí Local Charges
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Cước biển O/F USD */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <label htmlFor="ocean-freight-usd" className="block font-bold text-blue-700 dark:text-blue-300 mb-1">
                Cước biển chính O/F (USD / Container) *
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-muted-foreground font-mono font-bold">$</span>
                  <input
                    id="ocean-freight-usd"
                    type="number"
                    min="0"
                    step="10"
                    value={form.oceanFreightUsd}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, oceanFreightUsd: Number(e.target.value || 0) }))
                    }
                    className="w-full bg-background border border-border rounded-lg pl-7 pr-3 py-2 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="text-right text-xs font-mono text-muted-foreground shrink-0">
                  &asymp; <strong className="text-foreground">{formatCurrency(oceanFreightVnd)}</strong>
                </div>
              </div>
            </div>

            {/* Phí Docs */}
            <div>
              <label htmlFor="docs-fee" className="block font-medium text-foreground mb-1">
                Phí Docs (VND)
              </label>
              <CurrencyInput
                id="docs-fee"
                value={form.docsFee}
                onValueChange={(val) => setForm((prev) => ({ ...prev, docsFee: val ?? 0 }))}
                placeholder="0"
              />
            </div>

            {/* Phí Seal */}
            <div>
              <label htmlFor="seal-fee" className="block font-medium text-foreground mb-1">
                Phí Seal (VND)
              </label>
              <CurrencyInput
                id="seal-fee"
                value={form.sealFee}
                onValueChange={(val) => setForm((prev) => ({ ...prev, sealFee: val ?? 0 }))}
                placeholder="0"
              />
            </div>

            {/* Phí AFS */}
            <div>
              <label htmlFor="afs-fee" className="block font-medium text-foreground mb-1">
                Phí AFS (VND)
              </label>
              <CurrencyInput
                id="afs-fee"
                value={form.afsFee}
                onValueChange={(val) => setForm((prev) => ({ ...prev, afsFee: val ?? 0 }))}
                placeholder="0"
              />
            </div>

            {/* Phí Telex */}
            <div>
              <label htmlFor="telex-fee" className="block font-medium text-foreground mb-1">
                Phí Telex Release (VND)
              </label>
              <CurrencyInput
                id="telex-fee"
                value={form.telexFee}
                onValueChange={(val) => setForm((prev) => ({ ...prev, telexFee: val ?? 0 }))}
                placeholder="0"
              />
            </div>

            {/* Phí THC */}
            <div>
              <label htmlFor="thc-fee" className="block font-medium text-foreground mb-1">
                Phí THC (VND)
              </label>
              <CurrencyInput
                id="thc-fee"
                value={form.thcFee}
                onValueChange={(val) => setForm((prev) => ({ ...prev, thcFee: val ?? 0 }))}
                placeholder="0"
              />
            </div>

            {/* BAF / CAF */}
            <div>
              <label htmlFor="baf-caf-fee" className="block font-medium text-foreground mb-1">
                Phụ phí BAF/CAF (VND)
              </label>
              <CurrencyInput
                id="baf-caf-fee"
                value={form.bafCafFee}
                onValueChange={(val) => setForm((prev) => ({ ...prev, bafCafFee: val ?? 0 }))}
                placeholder="0"
              />
            </div>

            {/* Phụ phí khác */}
            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="other-surcharges" className="block font-medium text-foreground mb-1">
                Phụ phí thay đổi khác (VND)
              </label>
              <CurrencyInput
                id="other-surcharges"
                value={form.otherSurcharges}
                onValueChange={(val) => setForm((prev) => ({ ...prev, otherSurcharges: val ?? 0 }))}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Khối 4: Hiệu lực, Trạng thái & Ghi chú */}
        <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            4. Hiệu lực &amp; Ghi chú áp dụng
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Ngày bắt đầu */}
            <div>
              <label className="block font-medium text-foreground mb-1">
                Hiệu lực từ ngày *
              </label>
              <DatePicker
                value={form.validFrom}
                onChange={(val) => setForm((prev) => ({ ...prev, validFrom: val }))}
                error={errors.validFrom}
              />
            </div>

            {/* Ngày kết thúc */}
            <div>
              <label className="block font-medium text-foreground mb-1">
                Hiệu lực đến ngày *
              </label>
              <DatePicker
                value={form.validTo}
                onChange={(val) => setForm((prev) => ({ ...prev, validTo: val }))}
                error={errors.validTo}
              />
            </div>

            {/* Trạng thái */}
            <div>
              <label htmlFor="status-select" className="block font-medium text-foreground mb-1">
                Trạng thái áp dụng *
              </label>
              <select
                id="status-select"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE (Đang áp dụng)</option>
                <option value="INACTIVE">INACTIVE (Hết hiệu lực)</option>
              </select>
            </div>

            {/* Ghi chú */}
            <div className="sm:col-span-3">
              <label htmlFor="notes-textarea" className="block font-medium text-foreground mb-1">
                Ghi chú nghiệp vụ
              </label>
              <textarea
                id="notes-textarea"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Ghi chú điều kiện booking tàu, thời gian lưu bãi, quy định hàng lạnh..."
                className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : isEditing ? "Cập nhật biểu cước" : "Lưu biểu cước mới"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
