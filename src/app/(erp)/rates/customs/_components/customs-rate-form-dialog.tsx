"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { FileCheck, DollarSign, Building, Tag, Calendar } from "lucide-react";
import {
  CustomsRateItem,
  SaveCustomsRateInput,
  PROCEDURE_OPTIONS,
  SERVICE_CODE_OPTIONS,
  RATE_BASIS_OPTIONS,
} from "./types";
import {
  saveCustomsRateAction,
  getCommoditiesAction,
} from "@/features/master-data/actions";

interface CustomsRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: CustomsRateItem | null;
  providerOptions: { providerId: string; providerName: string }[];
  officeOptions: { officeId: string; officeName: string; countryCode: string }[];
  commodityOptions?: string[];
  onSuccess: () => void;
}

function getInitialForm(
  rate: CustomsRateItem | null,
  providerOptions: { providerId: string; providerName: string }[],
  officeOptions: { officeId: string; officeName: string; countryCode: string }[]
): SaveCustomsRateInput {
  if (rate) {
    return {
      rateId: rate.rateId,
      providerId: rate.providerId,
      providerName: rate.providerName,
      customsOfficeId: rate.customsOfficeId,
      customsOfficeName: rate.customsOfficeName,
      countryCode: rate.countryCode || "VN",
      customsProcedure: rate.customsProcedure || "EXPORT",
      serviceCode: rate.serviceCode || "DECLARATION",
      serviceName: rate.serviceName || "Mở tờ khai Hải quan",
      commodityId: rate.commodityId || null,
      commodityName: rate.commodityName || "Tất cả loại hàng",
      rateBasis: rate.rateBasis || "PER_DECLARATION",
      unitPrice: rate.unitPrice ?? 0,
      currency: rate.currency || "VND",
      validFrom: rate.validFrom || "2026-01-01",
      validTo: rate.validTo || "2026-12-31",
      status: rate.status || "ACTIVE",
      notes: rate.notes || "",
    };
  }

  const defaultProvider = providerOptions[0];
  const defaultOffice = officeOptions[0];

  return {
    providerId: defaultProvider?.providerId || "",
    providerName: defaultProvider?.providerName || "",
    customsOfficeId: defaultOffice?.officeId || "",
    customsOfficeName: defaultOffice?.officeName || "",
    countryCode: defaultOffice?.countryCode || "VN",
    customsProcedure: "EXPORT",
    serviceCode: "DECLARATION",
    serviceName: "Mở tờ khai xuất khẩu",
    commodityName: "Tất cả loại hàng",
    rateBasis: "PER_DECLARATION",
    unitPrice: 0,
    currency: "VND",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "",
  };
}

export function CustomsRateFormDialog({
  open,
  onOpenChange,
  rate,
  providerOptions,
  officeOptions,
  commodityOptions,
  onSuccess,
}: CustomsRateFormDialogProps) {
  if (!open) return null;

  const instanceKey = rate ? rate.rateId : "new";

  return (
    <CustomsRateFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      rate={rate}
      providerOptions={providerOptions}
      officeOptions={officeOptions}
      commodityOptions={commodityOptions}
      onSuccess={onSuccess}
    />
  );
}

function CustomsRateFormDialogContent({
  open,
  onOpenChange,
  rate,
  providerOptions,
  officeOptions,
  commodityOptions,
  onSuccess,
}: CustomsRateFormDialogProps) {
  const [form, setForm] = useState<SaveCustomsRateInput>(() =>
    getInitialForm(rate, providerOptions, officeOptions)
  );
  const isEditing = Boolean(rate);

  const [commodityList, setCommodityList] = useState<string[]>(commodityOptions || []);

  useEffect(() => {
    let isMounted = true;
    getCommoditiesAction().then((res) => {
      if (isMounted && res.success && res.data) {
        setCommodityList(res.data.map((c) => c.name).filter(Boolean));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.providerId?.trim()) {
      newErrors.providerId = "Vui lòng chọn đơn vị / đại lý cung cấp dịch vụ.";
    }
    if (!form.customsOfficeId?.trim()) {
      newErrors.customsOfficeId = "Vui lòng chọn Chi cục / Địa điểm làm thủ tục.";
    }
    if (!form.customsProcedure?.trim()) {
      newErrors.customsProcedure = "Vui lòng chọn loại hình thủ tục Hải quan.";
    }
    if (!form.serviceCode?.trim()) {
      newErrors.serviceCode = "Vui lòng chọn nhóm tác nghiệp dịch vụ.";
    }
    if (!form.serviceName?.trim()) {
      newErrors.serviceName = "Tên dịch vụ không được để trống.";
    }
    if (!form.commodityName?.trim()) {
      newErrors.commodityName = "Vui lòng chọn mặt hàng áp dụng từ danh mục.";
    }
    if (!form.rateBasis?.trim()) {
      newErrors.rateBasis = "Vui lòng chọn cơ sở tính giá.";
    }
    if (form.unitPrice < 0) {
      newErrors.unitPrice = "Đơn giá dịch vụ không được là số âm.";
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
      const res = await saveCustomsRateAction(form);
      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Lỗi lưu biểu phí dịch vụ Hải quan.");
      }
    } catch {
      toast.error("Lỗi khi kết nối đến máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <span>
            {isEditing
              ? `Chỉnh sửa biểu phí Hải quan [${rate?.serviceName} - ${rate?.customsOfficeName}]`
              : "Thêm biểu phí dịch vụ Hải quan mới"}
          </span>
        </div>
      }
      description="Thiết lập đơn giá mua đầu vào cho các thủ tục thông quan, mở tờ khai, kiểm dịch và kiểm hóa tại Chi cục Hải quan."
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {/* Nhóm 1: Đơn vị cung ứng & Chi cục Hải quan */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <h4 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Building className="w-4 h-4 text-blue-600" />
            1. Đơn Vị Cung Cấp &amp; Chi Cục Hải Quan
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Đại lý / Đơn vị cung cấp */}
            <div>
              <label htmlFor="customs-provider-select" className="block font-medium text-foreground mb-1">
                Đại lý / Đơn vị cung cấp *
              </label>
              <select
                id="customs-provider-select"
                value={form.providerId}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = providerOptions.find((p) => p.providerId === val);
                  setForm((prev) => ({
                    ...prev,
                    providerId: val,
                    providerName: matched?.providerName || val,
                  }));
                  if (errors.providerId) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.providerId;
                      return next;
                    });
                  }
                }}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                  errors.providerId ? "border-red-500" : "border-border"
                }`}
              >
                <option value="">-- Chọn đơn vị cung cấp dịch vụ --</option>
                {providerOptions.map((p) => (
                  <option key={p.providerId} value={p.providerId}>
                    {p.providerName}
                  </option>
                ))}
              </select>
              {errors.providerId && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.providerId}</p>
              )}
            </div>

            {/* Chi cục Hải quan */}
            <div>
              <label htmlFor="customs-office-select" className="block font-medium text-foreground mb-1">
                Chi cục / Địa điểm Hải quan áp dụng *
              </label>
              <select
                id="customs-office-select"
                value={form.customsOfficeId}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = officeOptions.find((o) => o.officeId === val);
                  setForm((prev) => ({
                    ...prev,
                    customsOfficeId: val,
                    customsOfficeName: matched?.officeName || val,
                    countryCode: matched?.countryCode || "VN",
                  }));
                  if (errors.customsOfficeId) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.customsOfficeId;
                      return next;
                    });
                  }
                }}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                  errors.customsOfficeId ? "border-red-500" : "border-border"
                }`}
              >
                <option value="">-- Chọn Chi cục Hải quan / Địa điểm --</option>
                {officeOptions.map((o) => (
                  <option key={o.officeId} value={o.officeId}>
                    {o.officeName} [{o.countryCode}]
                  </option>
                ))}
              </select>
              {errors.customsOfficeId && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.customsOfficeId}</p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            * Dữ liệu Đơn vị cung cấp lấy từ <strong>Danh mục Đối tác</strong>. Chi cục Hải quan lấy từ <strong>Danh mục Địa điểm</strong>.
          </p>
        </div>

        {/* Nhóm 2: Loại hình tờ khai & Dịch vụ & Mặt hàng */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <h4 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-blue-600" />
            2. Loại Hình Thủ Tục, Tên Dịch Vụ &amp; Mặt Hàng
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Loại hình */}
            <div>
              <label htmlFor="customs-procedure-select" className="block font-medium text-foreground mb-1">
                Loại hình tờ khai *
              </label>
              <select
                id="customs-procedure-select"
                value={form.customsProcedure}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({ ...prev, customsProcedure: val }));
                }}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {PROCEDURE_OPTIONS.filter((p) => p.id !== "ALL").map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nhóm dịch vụ */}
            <div>
              <label htmlFor="customs-service-code-select" className="block font-medium text-foreground mb-1">
                Nhóm tác nghiệp *
              </label>
              <select
                id="customs-service-code-select"
                value={form.serviceCode}
                onChange={(e) => {
                  const val = e.target.value;
                  const matched = SERVICE_CODE_OPTIONS.find((s) => s.id === val);
                  setForm((prev) => ({
                    ...prev,
                    serviceCode: val,
                    serviceName: prev.serviceName || matched?.label || val,
                  }));
                }}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {SERVICE_CODE_OPTIONS.filter((s) => s.id !== "ALL").map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mặt hàng áp dụng */}
            <div>
              <label htmlFor="customs-commodity-select" className="block font-medium text-foreground mb-1">
                Mặt hàng áp dụng *
              </label>
              <select
                id="customs-commodity-select"
                value={form.commodityName || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({ ...prev, commodityName: val }));
                  if (errors.commodityName) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.commodityName;
                      return next;
                    });
                  }
                }}
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.commodityName ? "border-red-500" : "border-border"
                }`}
              >
                <option value="">-- Chọn mặt hàng từ Danh mục --</option>
                <option value="Tất cả loại hàng">Tất cả loại hàng (Định mức chung)</option>
                {form.commodityName &&
                  form.commodityName !== "Tất cả loại hàng" &&
                  !commodityList.includes(form.commodityName) && (
                    <option value={form.commodityName}>
                      {form.commodityName} (Hiện tại)
                    </option>
                  )}
                {commodityList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.commodityName && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.commodityName}</p>
              )}
            </div>

            {/* Tên dịch vụ chi tiết */}
            <div className="sm:col-span-2 md:col-span-3">
              <label htmlFor="customs-service-name-input" className="block font-medium text-foreground mb-1">
                Tên chi tiết dịch vụ Hải quan *
              </label>
              <input
                id="customs-service-name-input"
                type="text"
                value={form.serviceName}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, serviceName: e.target.value }));
                  if (errors.serviceName) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.serviceName;
                      return next;
                    });
                  }
                }}
                placeholder="VD: Phí mở tờ khai xuất khẩu chính ngạch, Phí kiểm dịch thực vật chuối..."
                className={`w-full bg-background border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.serviceName ? "border-red-500" : "border-border"
                }`}
              />
              {errors.serviceName && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.serviceName}</p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            * Mặt hàng chọn trực tiếp từ <strong>Danh mục Hàng hóa</strong> hoặc <em>&quot;Tất cả loại hàng&quot;</em>.
          </p>
        </div>

        {/* Nhóm 3: Cơ sở tính giá & Đơn giá */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <h4 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            3. Cơ Sở Tính Giá &amp; Đơn Giá Mua Đầu Vào
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cơ sở tính giá */}
            <div>
              <label htmlFor="customs-rate-basis-select" className="block font-medium text-foreground mb-1">
                Cơ sở tính giá (Rate Basis) *
              </label>
              <select
                id="customs-rate-basis-select"
                value={form.rateBasis}
                onChange={(e) => setForm((prev) => ({ ...prev, rateBasis: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {RATE_BASIS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Đơn giá VND */}
            <div>
              <label className="block font-medium text-foreground mb-1">
                Đơn giá dịch vụ (VND) *
              </label>
              <CurrencyInput
                value={form.unitPrice}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, unitPrice: val ?? 0 }));
                  if (errors.unitPrice) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.unitPrice;
                      return next;
                    });
                  }
                }}
                className={`w-full text-right font-mono font-bold text-blue-600 ${
                  errors.unitPrice ? "border-red-500" : ""
                }`}
              />
              {errors.unitPrice && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.unitPrice}</p>
              )}
            </div>
          </div>
        </div>

        {/* Nhóm 4: Thời hạn hiệu lực & Ghi chú */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <h4 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            4. Thời Hạn Hiệu Lực &amp; Ghi Chú
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-foreground mb-1">
                Hiệu lực từ ngày *
              </label>
              <DatePicker
                value={form.validFrom}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, validFrom: val }));
                  if (errors.validFrom) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.validFrom;
                      return next;
                    });
                  }
                }}
              />
              {errors.validFrom && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.validFrom}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-foreground mb-1">
                Hiệu lực đến ngày *
              </label>
              <DatePicker
                value={form.validTo}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, validTo: val }));
                  if (errors.validTo) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.validTo;
                      return next;
                    });
                  }
                }}
              />
              {errors.validTo && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.validTo}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="customs-notes-input" className="block font-medium text-foreground mb-1">
                Ghi chú nghiệp vụ
              </label>
              <input
                id="customs-notes-input"
                type="text"
                value={form.notes || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="VD: Áp dụng cho tờ khai mở tại Cảng Chu Lai, bao gồm phí in ấn và nộp hồ sơ..."
                className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={saving}
            className="font-semibold shadow-xs"
          >
            {saving ? "Đang lưu..." : isEditing ? "Cập nhật biểu phí" : "Lưu biểu phí"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}

