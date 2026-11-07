"use client";

import { useState } from "react";
import { Receipt, Building2, MapPin, Truck, Calendar, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { saveRoadRateAction } from "@/features/master-data/actions";
import {
  DEFAULT_ROAD_RATE_FORM,
  COMMON_EQUIPMENT_OPTIONS,
  CURRENCY_OPTIONS,
  type RoadRateFormData,
  type RoadRateItem,
  type OptionItem,
} from "./types";

interface RatesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: RoadRateItem | null;
  vendors: OptionItem[];
  locations: OptionItem[];
  onSuccess: () => void;
}

export function RatesFormDialog({
  open,
  onOpenChange,
  initialData,
  vendors,
  locations,
  onSuccess,
}: RatesFormDialogProps) {
  const [formData, setFormData] = useState<RoadRateFormData>(DEFAULT_ROAD_RATE_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [prevInitialData, setPrevInitialData] = useState<RoadRateItem | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  // Chuẩn React 19: Điều chỉnh state trong render khi prop thay đổi
  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);
    if (open) {
      if (initialData) {
        setFormData({
          rateId: initialData.rateId,
          vendorId: initialData.vendorId,
          pickupLocationId: initialData.pickupLocationId,
          deliveryLocationId: initialData.deliveryLocationId,
          equipmentType: initialData.equipmentType,
          buyRate: initialData.buyRate,
          currency: initialData.currency || "VND",
          validFrom: initialData.validFrom || "",
          validTo: initialData.validTo || "",
          status: initialData.status || "APPROVED",
          remarks: initialData.remarks || "",
        });
      } else {
        setFormData({
          ...DEFAULT_ROAD_RATE_FORM,
          vendorId: vendors[0]?.id || "",
          pickupLocationId: locations[0]?.id || "",
          deliveryLocationId: locations[1]?.id || locations[0]?.id || "",
        });
      }
      setFormError("");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorId) {
      setFormError("Vui lòng chọn Nhà cung cấp / Đội xe.");
      return;
    }
    if (!formData.pickupLocationId) {
      setFormError("Vui lòng chọn Điểm xếp hàng (Origin).");
      return;
    }
    if (!formData.deliveryLocationId) {
      setFormError("Vui lòng chọn Điểm dỡ hàng (Destination).");
      return;
    }
    if (formData.pickupLocationId === formData.deliveryLocationId) {
      setFormError("Điểm xếp hàng và Điểm dỡ hàng không được trùng nhau.");
      return;
    }
    if (!formData.buyRate || formData.buyRate <= 0) {
      setFormError("Đơn giá mua phải lớn hơn 0.");
      return;
    }
    if (!formData.validFrom || !formData.validTo) {
      setFormError("Vui lòng nhập đầy đủ ngày hiệu lực bắt đầu và kết thúc.");
      return;
    }
    if (new Date(formData.validFrom) > new Date(formData.validTo)) {
      setFormError("Ngày bắt đầu hiệu lực không được lớn hơn ngày kết thúc.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    try {
      const res = await saveRoadRateAction(formData);
      if (!res.success) {
        throw new Error(res.error || "Không thể lưu biểu cước.");
      }
      toast.success(res.message || "Đã lưu biểu cước thành công!");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu dữ liệu.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      icon={Receipt}
      title={formData.rateId ? "Chỉnh sửa biểu cước đường bộ" : "Thêm mới biểu cước đường bộ"}
      description="Cập nhật đơn giá mua đầu vào từ nhà xe & đối tác vận tải toàn mạng lưới THILOGI."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
            {formError}
          </div>
        )}

            {/* Khối 1: Nhà cung cấp & Thiết bị */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="rate-vendor" className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Nhà cung cấp / Đối tác <span className="text-rose-500">*</span>
                </label>
                <select
                  id="rate-vendor"
                  required
                  value={formData.vendorId}
                  onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>-- Chọn Nhà xe / NCC --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.code ? `(${v.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rate-equipment" className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                  Loại thiết bị / Container <span className="text-rose-500">*</span>
                </label>
                <select
                  id="rate-equipment"
                  required
                  value={formData.equipmentType}
                  onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COMMON_EQUIPMENT_OPTIONS.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Khối 2: Tuyến đường (Origin -> Destination) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="rate-origin" className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Điểm xếp hàng (Origin) <span className="text-rose-500">*</span>
                </label>
                <select
                  id="rate-origin"
                  required
                  value={formData.pickupLocationId}
                  onChange={(e) => setFormData({ ...formData, pickupLocationId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>-- Chọn Điểm xếp hàng --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.code ? `(${loc.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rate-dest" className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  Điểm dỡ hàng (Destination) <span className="text-rose-500">*</span>
                </label>
                <select
                  id="rate-dest"
                  required
                  value={formData.deliveryLocationId}
                  onChange={(e) => setFormData({ ...formData, deliveryLocationId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>-- Chọn Điểm dỡ hàng --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.code ? `(${loc.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Khối 3: Đơn giá mua & Tiền tệ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label htmlFor="rate-price" className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Đơn giá mua đầu vào <span className="text-rose-500">*</span>
                </label>
                <CurrencyInput
                  id="rate-price"
                  value={formData.buyRate}
                  onValueChange={(val) => setFormData({ ...formData, buyRate: val ?? 0 })}
                  currencySuffix={formData.currency === "VND" ? " ₫" : ` ${formData.currency}`}
                  placeholder="0"
                  className="w-full font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400"
                />
              </div>

              <div>
                <label htmlFor="rate-currency" className="block font-medium text-foreground mb-1">
                  Đơn vị tiền tệ <span className="text-rose-500">*</span>
                </label>
                <select
                  id="rate-currency"
                  required
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Khối 4: Thời hạn hiệu lực & Trạng thái */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label htmlFor="rate-valid-from" className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Hiệu lực từ ngày <span className="text-rose-500">*</span>
                </label>
                <input
                  id="rate-valid-from"
                  type="date"
                  required
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="rate-valid-to" className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Hiệu lực đến ngày <span className="text-rose-500">*</span>
                </label>
                <input
                  id="rate-valid-to"
                  type="date"
                  required
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="rate-status" className="block font-medium text-foreground mb-1">
                  Trạng thái biểu cước
                </label>
                <select
                  id="rate-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="APPROVED">Áp dụng (APPROVED)</option>
                  <option value="DRAFT">Bản nháp (DRAFT)</option>
                  <option value="RETIRED">Ngừng áp dụng (RETIRED)</option>
                </select>
              </div>
            </div>

            {/* Khối 5: Ghi chú điều kiện cước */}
            <div>
              <label htmlFor="rate-remarks" className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                Ghi chú điều kiện cước / Phụ phí đính kèm
              </label>
              <textarea
                id="rate-remarks"
                rows={2}
                placeholder="VD: Cước đã bao gồm VAT & cầu đường, không bao gồm bốc xếp hạ bãi..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={formSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={formSubmitting}
              >
                {formData.rateId ? "Lưu thay đổi" : "Tạo biểu cước mới"}
              </Button>
            </div>
          </form>
    </ModalDialog>
  );
}

