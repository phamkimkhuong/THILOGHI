"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Building, Tag, Calendar, DollarSign, FileText, AlertCircle } from "lucide-react";
import {
  OtherRateItem,
  SaveOtherRateInput,
  OTHER_SERVICE_CODE_OPTIONS,
  PRICING_METHOD_OPTIONS,
  RATE_BASIS_OPTIONS,
} from "./types";
import { saveOtherRateAction } from "@/features/master-data/actions";

interface OtherRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate?: OtherRateItem | null;
  providerOptions: { providerId: string; providerName: string }[];
  onSuccess: () => void;
}

export function OtherRateFormDialog({
  open,
  onOpenChange,
  rate,
  providerOptions,
  onSuccess,
}: OtherRateFormDialogProps) {
  if (!open) return null;

  const instanceKey = rate ? rate.rateId : "new";

  return (
    <OtherRateFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      rate={rate}
      providerOptions={providerOptions}
      onSuccess={onSuccess}
    />
  );
}

function OtherRateFormDialogContent({
  open,
  onOpenChange,
  rate,
  providerOptions,
  onSuccess,
}: OtherRateFormDialogProps) {
  const isEdit = Boolean(rate?.rateId);

  // Khởi tạo state ban đầu trực tiếp từ rate hoặc options
  const [serviceCode, setServiceCode] = useState(
    rate?.serviceCode || "SURVEY"
  );
  const [serviceName, setServiceName] = useState(
    rate?.serviceName || "Khảo sát và giám định hiện trường hàng hóa"
  );
  const [providerId, setProviderId] = useState(
    rate?.providerId || providerOptions[0]?.providerId || ""
  );
  const [pricingMethod, setPricingMethod] = useState(rate?.pricingMethod || "FIXED");
  const [rateBasis, setRateBasis] = useState(rate?.rateBasis || "LOT");
  const [unitPrice, setUnitPrice] = useState<number>(rate?.unitPrice || 0);
  const [currency] = useState(rate?.currency || "VND");
  const [evidenceRequired, setEvidenceRequired] = useState<boolean>(
    rate?.evidenceRequired ?? false
  );
  const [validFrom, setValidFrom] = useState(rate?.validFrom || "2026-01-01");
  const [validTo, setValidTo] = useState(rate?.validTo || "2027-01-01");
  const [status, setStatus] = useState(rate?.status || "ACTIVE");
  const [notes, setNotes] = useState(rate?.notes || "");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Gợi ý tên dịch vụ và cơ sở tính giá khi đổi mã dịch vụ
  const handleServiceCodeChange = (code: string) => {
    setServiceCode(code);
    if (code === "SURVEY") {
      setServiceName("Khảo sát và giám định hiện trường hàng hóa");
      setRateBasis("LOT");
    } else if (code === "SPECIAL_EQUIPMENT") {
      setServiceName("Thuê thiết bị nâng / cẩu chuyên dụng hỗ trợ");
      setRateBasis("SHIFT");
    } else if (code === "DOCUMENT_DELIVERY") {
      setServiceName("Chuyển phát bộ chứng từ gốc XNK tận tay");
      setRateBasis("SET");
    } else if (code === "ESCORT") {
      setServiceName("Xe hoa tiêu dẫn đường hộ tống đoàn xe quá khổ quá tải");
      setRateBasis("TRIP");
    } else if (code === "OTHER_TEMPORARY") {
      setServiceName("Dịch vụ phát sinh tạm thời");
      setRateBasis("LOT");
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!serviceCode) errs.serviceCode = "Vui lòng chọn mã dịch vụ chuẩn.";
    if (!serviceName?.trim()) errs.serviceName = "Vui lòng nhập tên dịch vụ chi tiết.";
    if (!providerId) errs.providerId = "Vui lòng chọn nhà cung cấp / đối tác thực hiện.";
    if (!pricingMethod) errs.pricingMethod = "Vui lòng chọn phương pháp định giá.";
    if (!rateBasis) errs.rateBasis = "Vui lòng chọn cơ sở tính giá.";

    if (pricingMethod !== "ACTUAL") {
      if (unitPrice < 0) errs.unitPrice = "Đơn giá không được âm.";
    }

    if (serviceCode === "OTHER_TEMPORARY" && !notes.trim()) {
      errs.notes = "Dịch vụ tạm thời bắt buộc phải nhập lý do phát sinh và giải trình nghiệp vụ.";
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

    const provider = providerOptions.find((p) => p.providerId === providerId);

    const payload: SaveOtherRateInput = {
      rateId: rate?.rateId,
      serviceCode,
      serviceName,
      providerId,
      providerName: provider?.providerName || providerId,
      pricingMethod,
      rateBasis,
      unitPrice: pricingMethod === "ACTUAL" ? 0 : unitPrice,
      currency,
      evidenceRequired,
      validFrom,
      validTo,
      status,
      notes,
    };

    try {
      setSubmitting(true);
      const res = await saveOtherRateAction(payload);
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
      title={isEdit ? "Chỉnh sửa Biểu phí Dịch vụ Khác" : "Thêm mới Biểu phí Dịch vụ Khác"}
      description="Quản lý các định mức chi phí dịch vụ bổ sung có kiểm soát: giám định, thiết bị chuyên dụng, chuyển giao chứng từ, dẫn đường hộ tống theo quy chuẩn THILOGI."
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Phần 1: Phân loại mã dịch vụ & Đơn vị thực hiện */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider text-[11px]">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span>1. Phân Loại Dịch Vụ & Đơn Vị Cung Cấp</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Mã dịch vụ chuẩn */}
            <div>
              <label htmlFor="service-code-select" className="block text-muted-foreground font-medium mb-1">
                Mã dịch vụ chuẩn (OTHER_SERVICE_CODE) <span className="text-red-500">*</span>
              </label>
              <select
                id="service-code-select"
                value={serviceCode}
                onChange={(e) => handleServiceCodeChange(e.target.value)}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold ${
                  errors.serviceCode ? "border-red-500" : "border-border"
                }`}
              >
                {OTHER_SERVICE_CODE_OPTIONS.filter((c) => c.id !== "ALL").map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.id}] {c.label}
                  </option>
                ))}
              </select>
              {errors.serviceCode && <p className="text-[11px] text-red-500 mt-1">{errors.serviceCode}</p>}
            </div>

            {/* Đơn vị cung cấp */}
            <div>
              <label htmlFor="provider-select" className="block text-muted-foreground font-medium mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Nhà cung cấp / Đơn vị thực hiện <span className="text-red-500">*</span></span>
              </label>
              <select
                id="provider-select"
                value={providerId}
                onChange={(e) => {
                  setProviderId(e.target.value);
                  if (errors.providerId) setErrors((prev) => ({ ...prev, providerId: "" }));
                }}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.providerId ? "border-red-500" : "border-border"
                }`}
              >
                {providerOptions.map((p) => (
                  <option key={p.providerId} value={p.providerId}>
                    {p.providerName}
                  </option>
                ))}
              </select>
              {errors.providerId && <p className="text-[11px] text-red-500 mt-1">{errors.providerId}</p>}
            </div>

            {/* Tên dịch vụ chi tiết */}
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="service-name-input" className="block text-muted-foreground font-medium mb-1">
                Tên hiển thị chi tiết nghiệp vụ <span className="text-red-500">*</span>
              </label>
              <input
                id="service-name-input"
                type="text"
                value={serviceName}
                onChange={(e) => {
                  setServiceName(e.target.value);
                  if (errors.serviceName) setErrors((prev) => ({ ...prev, serviceName: "" }));
                }}
                placeholder="Ví dụ: Giám định khối lượng & chất lượng hàng nông sản tại kho Chu Lai"
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.serviceName ? "border-red-500" : "border-border"
                }`}
              />
              {errors.serviceName && <p className="text-[11px] text-red-500 mt-1">{errors.serviceName}</p>}
            </div>
          </div>
        </div>

        {/* Phần 2: Cơ chế định giá & Đơn vị tính */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider text-[11px]">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            <span>2. Cơ Chế Định Giá & Đơn Giá</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Phương pháp định giá */}
            <div>
              <label htmlFor="pricing-method-select" className="block text-muted-foreground font-medium mb-1">
                Phương pháp định giá <span className="text-red-500">*</span>
              </label>
              <select
                id="pricing-method-select"
                value={pricingMethod}
                onChange={(e) => {
                  const val = e.target.value;
                  setPricingMethod(val);
                  if (val === "ACTUAL") {
                    setEvidenceRequired(true);
                  }
                }}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {PRICING_METHOD_OPTIONS.map((pm) => (
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

            {/* Đơn giá định mức */}
            <div>
              <label className="block text-muted-foreground font-medium mb-1">
                Đơn giá (VND) {pricingMethod !== "ACTUAL" && <span className="text-red-500">*</span>}
              </label>
              {pricingMethod === "ACTUAL" ? (
                <div className="h-9 px-3 py-2 rounded-lg bg-orange-50/60 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Theo biên lai thực tế</span>
                </div>
              ) : (
                <CurrencyInput
                  value={unitPrice}
                  onValueChange={(val) => {
                    setUnitPrice(val ?? 0);
                    if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: "" }));
                  }}
                  placeholder="Ví dụ: 500.000"
                />
              )}
              {errors.unitPrice && <p className="text-[11px] text-red-500 mt-1">{errors.unitPrice}</p>}
            </div>
          </div>

          {/* Checkbox yêu cầu chứng từ */}
          <div className="pt-2 border-t border-border/60 flex items-center gap-2">
            <input
              id="evidence-required-checkbox"
              type="checkbox"
              checked={evidenceRequired}
              onChange={(e) => setEvidenceRequired(e.target.checked)}
              className="rounded border-border text-primary focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="evidence-required-checkbox" className="text-foreground font-medium cursor-pointer">
              Yêu cầu bắt buộc đính kèm Hóa đơn / Biên lai / Chứng từ thực tế (Evidence) khi quyết toán P&L
            </label>
          </div>
        </div>

        {/* Phần 3: Thời hạn hiệu lực & Ghi chú */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
          <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wider text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>3. Thời Hạn Hiệu Lực & Ghi Chú</span>
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
            <label htmlFor="notes-textarea" className="block text-muted-foreground font-medium mb-1 flex items-center justify-between">
              <span>Ghi chú điều kiện / Giải trình nghiệp vụ</span>
              {serviceCode === "OTHER_TEMPORARY" && (
                <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Bắt buộc với Dịch vụ tạm thời
                </span>
              )}
            </label>
            <textarea
              id="notes-textarea"
              rows={2}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errors.notes) setErrors((prev) => ({ ...prev, notes: "" }));
              }}
              placeholder={
                serviceCode === "OTHER_TEMPORARY"
                  ? "Bắt buộc giải trình vì sao phát sinh dịch vụ này và lý do không thuộc 7 gói dịch vụ chuẩn..."
                  : "Ví dụ: Áp dụng trong giờ hành chính, ngoài giờ tính thêm phụ phí theo thỏa thuận..."
              }
              className={`w-full bg-background border rounded-lg px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.notes ? "border-red-500" : "border-border"
              }`}
            />
            {errors.notes && <p className="text-[11px] text-red-500 mt-1">{errors.notes}</p>}
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
