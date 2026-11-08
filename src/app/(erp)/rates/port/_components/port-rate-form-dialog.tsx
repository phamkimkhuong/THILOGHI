"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Anchor } from "lucide-react";
import {
  PortRateItem,
  SavePortRateInput,
  CHARGE_CODES,
  CONTAINER_TYPES,
} from "./types";
import { savePortRateAction } from "@/features/master-data/actions";

interface PortRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: PortRateItem | null;
  onSuccess: () => void;
}

function getInitialForm(rate: PortRateItem | null): SavePortRateInput {
  if (rate) {
    return {
      rateId: rate.rateId,
      portCode: rate.portCode || "CHU_LAI",
      portName: rate.portName || "Cảng Chu Lai",
      serviceCategory: rate.serviceCategory || "Phí xếp dỡ container",
      chargeCode: rate.chargeCode || "LOLO",
      cargoType: rate.cargoType || "Empty",
      containerType: rate.containerType || "20GP",
      unit: rate.unit || "Cont",
      unitPrice: rate.unitPrice ?? 0,
      currency: rate.currency || "VND",
      validFrom: rate.validFrom || "2026-01-01",
      validTo: rate.validTo || "2026-12-31",
      status: rate.status || "ACTIVE",
      notes: rate.notes || "",
    };
  }

  return {
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "LOLO",
    cargoType: "Empty",
    containerType: "20GP",
    unit: "Cont",
    unitPrice: 350000,
    currency: "VND",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "",
  };
}

export function PortRateFormDialog({
  open,
  onOpenChange,
  rate,
  onSuccess,
}: PortRateFormDialogProps) {
  if (!open) return null;

  const instanceKey = rate ? rate.rateId : "new";

  return (
    <PortRateFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      rate={rate}
      onSuccess={onSuccess}
    />
  );
}

function PortRateFormDialogContent({
  open,
  onOpenChange,
  rate,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: PortRateItem | null;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(rate);
  const [formData, setFormData] = useState<SavePortRateInput>(() => getInitialForm(rate));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.chargeCode.trim()) {
      errs.chargeCode = "Mã tác nghiệp là bắt buộc.";
    }
    if (!formData.unitPrice || formData.unitPrice <= 0) {
      errs.unitPrice = "Đơn giá phải lớn hơn 0.";
    }
    if (!formData.validFrom) {
      errs.validFrom = "Vui lòng chọn ngày bắt đầu hiệu lực.";
    }
    if (!formData.validTo) {
      errs.validTo = "Vui lòng chọn ngày kết thúc hiệu lực.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại các trường bắt buộc.");
      return;
    }

    try {
      setSaving(true);
      const res = await savePortRateAction(formData);
      if (!res.success) {
        toast.error(res.error || "Không thể lưu biểu phí.");
        return;
      }

      toast.success(res.message || "Đã lưu biểu phí cảng thành công.");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
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
          <Anchor className="w-5 h-5 text-blue-600" />
          <span>
            {isEditing
              ? `Chỉnh sửa biểu phí [${rate?.chargeCode} - ${rate?.containerType}]`
              : "Thêm biểu phí dịch vụ Cảng mới"}
          </span>
        </div>
      }
      description="Thiết lập đơn giá mua đầu vào cho các tác nghiệp tại Cảng Chu Lai / Depot."
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {/* Hàng 1: Cảng & Nhóm tác nghiệp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Cảng / Depot <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.portCode}
              onChange={(e) => {
                const portCode = e.target.value;
                const portName = portCode === "CHU_LAI" ? "Cảng Chu Lai" : portCode;
                setFormData((prev) => ({ ...prev, portCode, portName }));
              }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="CHU_LAI">Cảng Chu Lai (CHU_LAI)</option>
              <option value="DEPOT_CL">Depot Chu Lai (DEPOT_CL)</option>
              <option value="DA_NANG">Cảng Đà Nẵng (DA_NANG)</option>
              <option value="QUY_NHON">Cảng Quy Nhơn (QUY_NHON)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Nhóm dịch vụ <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.serviceCategory}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, serviceCategory: e.target.value }))
              }
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Phí xếp dỡ container">Phí xếp dỡ container</option>
              <option value="Dịch vụ bãi container">Dịch vụ bãi container</option>
              <option value="Phí THC Cảng">Phí THC Cảng</option>
              <option value="Dịch vụ lưu kho/bãi">Dịch vụ lưu kho/bãi</option>
              <option value="Dịch vụ khác">Dịch vụ khác</option>
            </select>
          </div>
        </div>

        {/* Hàng 2: Mã tác nghiệp & Loại hàng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Mã tác nghiệp (Charge Code) <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.chargeCode}
              onChange={(e) => {
                const code = e.target.value;
                let defaultUnit = formData.unit;
                if (code === "POWER") defaultUnit = "Giờ";
                if (code === "STORAGE") defaultUnit = "Ngày";
                if (code === "LOLO" || code === "THC_PORT") defaultUnit = "Cont";

                setFormData((prev) => ({ ...prev, chargeCode: code, unit: defaultUnit }));
                setErrors((prev) => ({ ...prev, chargeCode: "" }));
              }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CHARGE_CODES.filter((c) => c.id !== "ALL").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.label}
                </option>
              ))}
            </select>
            {errors.chargeCode && (
              <p className="text-destructive text-[11px] mt-1">{errors.chargeCode}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Phân loại hàng container <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.cargoType}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, cargoType: e.target.value }))
              }
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Empty">Vỏ rỗng (Empty)</option>
              <option value="Loaded">Có hàng (Loaded)</option>
              <option value="ALL">Tất cả trạng thái cont (ALL)</option>
            </select>
          </div>
        </div>

        {/* Hàng 3: Loại Cont & Đơn vị tính */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Loại Container <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.containerType}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, containerType: e.target.value }))
              }
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CONTAINER_TYPES.filter((c) => c.id !== "ALL").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
              <option value="ALL">Tất cả loại cont (ALL)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Đơn vị tính (Unit) <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, unit: e.target.value }))
              }
              placeholder="Cont, Giờ, Ngày, Tấn..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Hàng 4: Đơn giá & Loại tiền tệ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 rounded-xl bg-muted/30 border border-border">
          <div className="sm:col-span-2">
            <label className="block font-medium text-foreground mb-1">
              Đơn giá mua đầu vào <span className="text-destructive">*</span>
            </label>
            {formData.currency === "USD" ? (
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, unitPrice: val }));
                  setErrors((prev) => ({ ...prev, unitPrice: "" }));
                }}
                placeholder="Nhập số USD (ví dụ: 0.5)"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground font-mono focus:border-primary focus:outline-none text-right"
              />
            ) : (
              <CurrencyInput
                value={formData.unitPrice}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, unitPrice: val ?? 0 }));
                  setErrors((prev) => ({ ...prev, unitPrice: "" }));
                }}
                placeholder="0 ₫"
              />
            )}
            {errors.unitPrice && (
              <p className="text-destructive text-[11px] mt-1">{errors.unitPrice}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Nguyên tệ
            </label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currency: e.target.value,
                  unitPrice: e.target.value === "USD" ? 0.5 : 350000,
                }))
              }
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="VND">VND (Việt Nam Đồng)</option>
              <option value="USD">USD (Đô la Mỹ)</option>
            </select>
          </div>
        </div>

        {/* Hàng 5: Thời hạn hiệu lực */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Hiệu lực từ ngày <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, validFrom: e.target.value }))
              }
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.validFrom && (
              <p className="text-destructive text-[11px] mt-1">{errors.validFrom}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Hiệu lực đến ngày <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={formData.validTo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, validTo: e.target.value }))
              }
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.validTo && (
              <p className="text-destructive text-[11px] mt-1">{errors.validTo}</p>
            )}
          </div>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block font-medium text-foreground mb-1">
            Ghi chú / Điều kiện áp dụng
          </label>
          <textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={2}
            placeholder="Ghi chú quy cách container, giờ phục vụ, phụ phí..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Trạng thái áp dụng */}
        <div>
          <label className="block font-medium text-foreground mb-1">
            Trạng thái bản ghi
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, status: e.target.value }))
            }
            className="w-full sm:w-1/2 bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ACTIVE">ACTIVE - Đang áp dụng</option>
            <option value="INACTIVE">INACTIVE - Tạm dừng / Hết hạn</option>
            <option value="DRAFT">DRAFT - Bản nháp chờ duyệt</option>
          </select>
        </div>

        {/* Nút hành động */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : isEditing ? "Cập nhật biểu phí" : "Tạo biểu phí mới"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
