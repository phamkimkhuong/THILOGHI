"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Shield, Truck, Tag, Calendar, AlertCircle, Percent } from "lucide-react";
import {
  InsuranceRateItem,
  SaveInsuranceRateInput,
  COVERAGE_TYPE_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  PRICING_MODEL_OPTIONS,
  RATE_BASIS_OPTIONS,
} from "./types";
import {
  saveInsuranceRateAction,
  getCommoditiesAction,
} from "@/features/master-data/actions";

interface InsuranceRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate?: InsuranceRateItem | null;
  insurerOptions: { insurerId: string; insurerName: string }[];
  commodityOptions?: { id: string; name: string }[];
  onSuccess: () => void;
}

export function InsuranceRateFormDialog({
  open,
  onOpenChange,
  rate,
  insurerOptions,
  commodityOptions,
  onSuccess,
}: InsuranceRateFormDialogProps) {
  if (!open) return null;

  const instanceKey = rate ? rate.rateId : "new";

  return (
    <InsuranceRateFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      rate={rate}
      insurerOptions={insurerOptions}
      commodityOptions={commodityOptions}
      onSuccess={onSuccess}
    />
  );
}

function InsuranceRateFormDialogContent({
  open,
  onOpenChange,
  rate,
  insurerOptions,
  commodityOptions: initialCommodities = [],
  onSuccess,
}: InsuranceRateFormDialogProps) {
  const isEdit = Boolean(rate?.rateId);

  // Khởi tạo state ban đầu trực tiếp từ rate hoặc options
  const [insurerId, setInsurerId] = useState(
    rate?.insurerId || insurerOptions[0]?.insurerId || ""
  );
  const [coverageType, setCoverageType] = useState(rate?.coverageType || "ALL_RISKS");
  const [transportMode, setTransportMode] = useState(rate?.transportMode || "MULTIMODAL");
  const [commodityId, setCommodityId] = useState<string>(
    rate?.commodityId || "ALL"
  );
  const [pricingModel, setPricingModel] = useState(rate?.pricingModel || "FIXED_PER_SHIPMENT");
  const [rateBasis, setRateBasis] = useState(rate?.rateBasis || "PER_CONTAINER");
  const [unitPrice, setUnitPrice] = useState<number>(rate?.unitPrice || 0);
  const [ratePercent, setRatePercent] = useState<number>(rate?.ratePercent || 0.1);
  const [minPremiumVnd, setMinPremiumVnd] = useState<number>(rate?.minPremiumVnd || 0);
  const [deductibleVnd, setDeductibleVnd] = useState<number>(rate?.deductibleVnd || 0);
  const [maxInsuredValueVnd, setMaxInsuredValueVnd] = useState<number>(
    rate?.maxInsuredValueVnd || 0
  );
  const [currency] = useState(rate?.currency || "VND");
  const [validFrom, setValidFrom] = useState(rate?.validFrom || "2026-01-01");
  const [validTo, setValidTo] = useState(rate?.validTo || "2027-01-01");
  const [status, setStatus] = useState(rate?.status || "ACTIVE");
  const [notes, setNotes] = useState(rate?.notes || "");

  const [commodities, setCommodities] = useState<{ id: string; name: string }[]>(initialCommodities);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Nạp danh mục mặt hàng từ database nếu chưa có
  useEffect(() => {
    let isMounted = true;
    if (commodities.length === 0) {
      getCommoditiesAction().then((res) => {
        if (isMounted && res.success && res.data) {
          setCommodities(
            res.data.map((c: { commodityId?: string; id?: string; name: string }) => ({
              id: c.commodityId || c.id || "",
              name: c.name,
            }))
          );
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [commodities.length]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!insurerId) errs.insurerId = "Vui lòng chọn công ty/đơn vị bảo hiểm.";
    if (!coverageType) errs.coverageType = "Vui lòng chọn phạm vi bảo hiểm.";
    if (!transportMode) errs.transportMode = "Vui lòng chọn phương thức vận tải.";

    if (pricingModel === "FIXED_PER_SHIPMENT") {
      if (unitPrice < 0) errs.unitPrice = "Đơn giá không được âm.";
    } else {
      if (ratePercent <= 0 || ratePercent > 100) {
        errs.ratePercent = "Tỷ lệ phần trăm phí bảo hiểm phải lớn hơn 0 và nhỏ hơn hoặc bằng 100%.";
      }
    }

    if (!validFrom) errs.validFrom = "Vui lòng chọn ngày bắt đầu hiệu lực.";
    if (!validTo) errs.validTo = "Vui lòng chọn ngày kết thúc hiệu lực.";
    if (validFrom && validTo && validFrom >= validTo) {
      errs.validTo = "Ngày kết thúc phải sau ngày bắt đầu hiệu lực.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin lỗi.");
      return;
    }

    const insurer = insurerOptions.find((p) => p.insurerId === insurerId);
    const selectedComm = commodities.find((c) => c.id === commodityId);

    const payload: SaveInsuranceRateInput = {
      rateId: rate?.rateId,
      insurerId,
      insurerName: insurer?.insurerName || insurerId,
      coverageType,
      transportMode,
      commodityId: commodityId === "ALL" ? null : commodityId,
      commodityName: commodityId === "ALL" ? "Tất cả loại hàng" : selectedComm?.name || "Tất cả loại hàng",
      pricingModel,
      rateBasis,
      unitPrice: pricingModel === "FIXED_PER_SHIPMENT" ? unitPrice : 0,
      ratePercent: pricingModel === "PERCENT_OF_VALUE" ? ratePercent : 0,
      minPremiumVnd,
      deductibleVnd,
      maxInsuredValueVnd: maxInsuredValueVnd > 0 ? maxInsuredValueVnd : null,
      currency,
      validFrom,
      validTo,
      status,
      notes,
    };

    try {
      setSubmitting(true);
      const res = await saveInsuranceRateAction(payload);
      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Có lỗi xảy ra khi lưu biểu phí.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi hệ thống khi lưu biểu phí.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Chỉnh sửa Biểu phí Bảo hiểm Hàng hóa" : "Thêm mới Biểu phí Bảo hiểm Hàng hóa"}
      description="Thiết lập bảng giá định mức chi phí mua bảo hiểm hàng hóa vận tải đường bộ, đường biển hoặc đa phương thức."
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Phần 1: Đơn vị bảo hiểm & Phạm vi bảo hiểm */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider text-[11px]">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>1. Đơn Vị Bảo Hiểm & Phạm Vi Áp Dụng</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Đơn vị bảo hiểm */}
            <div>
              <label htmlFor="insurer-select" className="block text-muted-foreground font-medium mb-1">
                Công ty / Đơn vị bảo hiểm <span className="text-red-500">*</span>
              </label>
              <select
                id="insurer-select"
                value={insurerId}
                onChange={(e) => {
                  setInsurerId(e.target.value);
                  if (errors.insurerId) setErrors((prev) => ({ ...prev, insurerId: "" }));
                }}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.insurerId ? "border-red-500" : "border-border"
                }`}
              >
                {insurerOptions.map((ins) => (
                  <option key={ins.insurerId} value={ins.insurerId}>
                    {ins.insurerName}
                  </option>
                ))}
              </select>
              {errors.insurerId && <p className="text-[11px] text-red-500 mt-1">{errors.insurerId}</p>}
            </div>

            {/* Phạm vi bảo hiểm */}
            <div>
              <label htmlFor="coverage-select" className="block text-muted-foreground font-medium mb-1">
                Phạm vi điều kiện bảo hiểm <span className="text-red-500">*</span>
              </label>
              <select
                id="coverage-select"
                value={coverageType}
                onChange={(e) => {
                  setCoverageType(e.target.value);
                  if (errors.coverageType) setErrors((prev) => ({ ...prev, coverageType: "" }));
                }}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.coverageType ? "border-red-500" : "border-border"
                }`}
              >
                {COVERAGE_TYPE_OPTIONS.filter((c) => c.id !== "ALL").map((cov) => (
                  <option key={cov.id} value={cov.id}>
                    {cov.label} ({cov.desc})
                  </option>
                ))}
              </select>
              {errors.coverageType && <p className="text-[11px] text-red-500 mt-1">{errors.coverageType}</p>}
            </div>

            {/* Phương thức vận tải */}
            <div>
              <label htmlFor="transport-mode-select" className="block text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Phương thức vận tải <span className="text-red-500">*</span></span>
              </label>
              <select
                id="transport-mode-select"
                value={transportMode}
                onChange={(e) => {
                  setTransportMode(e.target.value);
                  if (errors.transportMode) setErrors((prev) => ({ ...prev, transportMode: "" }));
                }}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.transportMode ? "border-red-500" : "border-border"
                }`}
              >
                {TRANSPORT_MODE_OPTIONS.filter((m) => m.id !== "ALL").map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              {errors.transportMode && <p className="text-[11px] text-red-500 mt-1">{errors.transportMode}</p>}
            </div>

            {/* Mặt hàng áp dụng */}
            <div>
              <label htmlFor="commodity-select" className="block text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Mặt hàng áp dụng <span className="text-red-500">*</span></span>
              </label>
              <select
                id="commodity-select"
                value={commodityId}
                onChange={(e) => setCommodityId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">-- Tất cả loại hàng (Áp dụng chung) --</option>
                {commodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Phần 2: Cơ chế định giá & Mức phí bảo hiểm */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider text-[11px]">
            <Percent className="w-3.5 h-3.5 text-primary" />
            <span>2. Cơ Chế Định Giá & Mức Phí Bảo Hiểm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Mô hình tính phí */}
            <div>
              <label htmlFor="pricing-model-select" className="block text-muted-foreground font-medium mb-1">
                Mô hình tính phí <span className="text-red-500">*</span>
              </label>
              <select
                id="pricing-model-select"
                value={pricingModel}
                onChange={(e) => {
                  const val = e.target.value;
                  setPricingModel(val);
                  if (val === "PERCENT_OF_VALUE") {
                    setRateBasis("PERCENT_VALUE");
                  } else {
                    setRateBasis("PER_CONTAINER");
                  }
                }}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PRICING_MODEL_OPTIONS.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cơ sở tính */}
            <div>
              <label htmlFor="rate-basis-select" className="block text-muted-foreground font-medium mb-1">
                Cơ sở tính cước <span className="text-red-500">*</span>
              </label>
              <select
                id="rate-basis-select"
                value={rateBasis}
                onChange={(e) => setRateBasis(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              >
                {RATE_BASIS_OPTIONS.map((rb) => (
                  <option key={rb.id} value={rb.id}>
                    {rb.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nhập mức phí theo mô hình */}
            {pricingModel === "PERCENT_OF_VALUE" ? (
              <>
                <div>
                  <label htmlFor="rate-percent-input" className="block text-muted-foreground font-medium mb-1">
                    Tỷ lệ phí bảo hiểm (%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="rate-percent-input"
                      type="number"
                      step="0.001"
                      min="0"
                      max="100"
                      value={ratePercent}
                      onChange={(e) => {
                        setRatePercent(parseFloat(e.target.value) || 0);
                        if (errors.ratePercent) setErrors((prev) => ({ ...prev, ratePercent: "" }));
                      }}
                      className={`w-full bg-background border rounded-lg px-2.5 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8 ${
                        errors.ratePercent ? "border-red-500" : "border-border"
                      }`}
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground font-bold">%</span>
                  </div>
                  {errors.ratePercent && <p className="text-[11px] text-red-500 mt-1">{errors.ratePercent}</p>}
                </div>

                <div>
                  <label htmlFor="min-premium-input" className="block text-muted-foreground font-medium mb-1">
                    Phí tối thiểu / chuyến (VND)
                  </label>
                  <CurrencyInput
                    value={minPremiumVnd}
                    onValueChange={(val) => setMinPremiumVnd(val ?? 0)}
                    placeholder="Ví dụ: 100.000"
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="unit-price-input" className="block text-muted-foreground font-medium mb-1">
                  Đơn giá trọn gói (VND) <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  value={unitPrice}
                  onValueChange={(val) => {
                    setUnitPrice(val ?? 0);
                    if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: "" }));
                  }}
                  placeholder="Ví dụ: 100.000"
                />
                {errors.unitPrice && <p className="text-[11px] text-red-500 mt-1">{errors.unitPrice}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Phần 3: Mức khấu trừ & Giới hạn trách nhiệm */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-primary" />
            <span>3. Mức Khấu Trừ & Giới Hạn Trách Nhiệm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Mức khấu trừ */}
            <div>
              <label htmlFor="deductible-input" className="block text-muted-foreground font-medium mb-1">
                Mức khấu trừ tổn thất (Deductible VND)
              </label>
              <CurrencyInput
                value={deductibleVnd}
                onValueChange={(val) => setDeductibleVnd(val ?? 0)}
                placeholder="Nhập 0 nếu không áp dụng khấu trừ"
              />
            </div>

            {/* Giới hạn bồi thường tối đa */}
            <div>
              <label htmlFor="max-insured-input" className="block text-muted-foreground font-medium mb-1">
                Giới hạn trách nhiệm tối đa (VND)
              </label>
              <CurrencyInput
                value={maxInsuredValueVnd}
                onValueChange={(val) => setMaxInsuredValueVnd(val ?? 0)}
                placeholder="Để trống hoặc 0 nếu không giới hạn"
              />
            </div>
          </div>
        </div>

        {/* Phần 4: Thời hạn hiệu lực & Trạng thái */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>4. Thời Hạn Hiệu Lực & Ghi Chú</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-muted-foreground font-medium mb-1">
                Hiệu lực từ ngày <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={validFrom}
                onChange={(val) => {
                  setValidFrom(val);
                  if (errors.validFrom) setErrors((prev) => ({ ...prev, validFrom: "" }));
                }}
              />
              {errors.validFrom && <p className="text-[11px] text-red-500 mt-1">{errors.validFrom}</p>}
            </div>

            <div>
              <label className="block text-muted-foreground font-medium mb-1">
                Đến hết ngày <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={validTo}
                onChange={(val) => {
                  setValidTo(val);
                  if (errors.validTo) setErrors((prev) => ({ ...prev, validTo: "" }));
                }}
              />
              {errors.validTo && <p className="text-[11px] text-red-500 mt-1">{errors.validTo}</p>}
            </div>

            <div>
              <label htmlFor="status-select" className="block text-muted-foreground font-medium mb-1">
                Trạng thái hiệu lực
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="ACTIVE">ACTIVE (Đang áp dụng)</option>
                <option value="INACTIVE">INACTIVE (Hết hiệu lực)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="notes-textarea" className="block text-muted-foreground font-medium mb-1">
              Ghi chú điều khoản bổ sung / Quy tắc bồi thường
            </label>
            <textarea
              id="notes-textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Áp dụng theo Quy tắc bảo hiểm hàng hóa vận chuyển đường biển và đường bộ của THILOGI / PJICO..."
              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Nút hành động Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting}
            className="min-w-[120px]"
          >
            {submitting ? "Đang lưu..." : isEdit ? "Cập nhật biểu phí" : "Tạo biểu phí mới"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}