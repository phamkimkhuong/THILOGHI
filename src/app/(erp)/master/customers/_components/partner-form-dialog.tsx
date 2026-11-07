"use client";

import { useState } from "react";
import { Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { savePartnerAction } from "@/features/master-data/actions";
import {
  DEFAULT_PARTNER_FORM,
  COMMON_PARTNER_TYPES,
  COMMON_COUNTRIES,
  type PartnerFormData,
  type PartnerDirectoryItem,
} from "./types";

interface PartnerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: PartnerDirectoryItem | null;
  onSuccess: () => void;
}

export function PartnerFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: PartnerFormDialogProps) {
  const [formData, setFormData] = useState<PartnerFormData>(DEFAULT_PARTNER_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [prevInitialData, setPrevInitialData] = useState<PartnerDirectoryItem | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  // Chuẩn React 19: Điều chỉnh state trong render khi prop thay đổi
  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);
    if (open) {
      if (initialData) {
        setFormData({
          partnerId: initialData.partnerId,
          partnerName: initialData.partnerName,
          shortName: initialData.shortName || "",
          sourcePartnerType: initialData.sourcePartnerType || "Clients",
          country: initialData.country || "Việt Nam",
          address: initialData.address || "",
          taxCode: initialData.taxCode || "",
          phone: initialData.phone || "",
          email: initialData.email || "",
          representedBy: initialData.representedBy || "",
          bankAccount: initialData.bankAccount || "",
          bankName: initialData.bankName || "",
          gpsCoordinates: initialData.gpsCoordinates || "",
          note: initialData.note || "",
          status: initialData.status || "ACTIVE",
        });
      } else {
        setFormData(DEFAULT_PARTNER_FORM);
      }
      setFormError("");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partnerId.trim()) {
      setFormError("Mã đối tác (ID) không được để trống.");
      return;
    }
    if (!formData.partnerName.trim()) {
      setFormError("Tên pháp nhân công ty không được để trống.");
      return;
    }
    if (!formData.sourcePartnerType) {
      setFormError("Vui lòng chọn phân loại đối tác.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    try {
      const res = await savePartnerAction({
        partnerId: formData.partnerId.trim().toUpperCase(),
        partnerName: formData.partnerName.trim(),
        shortName: formData.shortName.trim() || undefined,
        sourcePartnerType: formData.sourcePartnerType,
        country: formData.country,
        address: formData.address.trim() || undefined,
        taxCode: formData.taxCode.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        representedBy: formData.representedBy.trim() || undefined,
        bankAccount: formData.bankAccount.trim() || undefined,
        bankName: formData.bankName.trim() || undefined,
        gpsCoordinates: formData.gpsCoordinates.trim() || undefined,
        note: formData.note.trim() || undefined,
        status: formData.status,
      });

      if (!res.success) {
        throw new Error(res.error || "Không thể lưu thông tin đối tác.");
      }

      toast.success(res.message || "Đã lưu đối tác thành công!");
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

  const isEditing = Boolean(initialData?.partnerId);

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      icon={Building2}
      title={isEditing ? "Chỉnh sửa hồ sơ đối tác" : "Thêm mới đối tác"}
      description="Cập nhật thông tin danh bạ khách hàng, nhà xe, cảng biển, bãi depot toàn hệ thống THILOGI."
    >
      {/* Form Thông Báo Lỗi */}
      {formError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Mã đối tác ID */}
              <div>
                <label htmlFor="pt-id" className="block font-medium text-foreground mb-1">
                  Mã đối tác (ID) <span className="text-red-500">*</span>
                </label>
                <input
                  id="pt-id"
                  type="text"
                  placeholder="VD: THILOGI, MAERSK, CAMBODIA_AGRI"
                  value={formData.partnerId}
                  disabled={isEditing}
                  onChange={(e) =>
                    setFormData({ ...formData, partnerId: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* 2. Tên ngắn viết tắt */}
              <div>
                <label htmlFor="pt-short" className="block font-medium text-foreground mb-1">
                  Tên viết tắt (Short Name)
                </label>
                <input
                  id="pt-short"
                  type="text"
                  placeholder="VD: THILOGI, THACO AGRI, MAERSK"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 3. Tên pháp nhân đầy đủ */}
              <div className="sm:col-span-2">
                <label htmlFor="pt-name" className="block font-medium text-foreground mb-1">
                  Tên pháp nhân đầy đủ <span className="text-red-500">*</span>
                </label>
                <input
                  id="pt-name"
                  type="text"
                  placeholder="VD: CÔNG TY TNHH GIAO NHẬN VẬN CHUYỂN QUỐC TẾ TRƯỜNG HẢI"
                  value={formData.partnerName}
                  onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* 4. Phân nhóm đối tác */}
              <div>
                <label htmlFor="pt-type" className="block font-medium text-foreground mb-1">
                  Phân nhóm đối tác <span className="text-red-500">*</span>
                </label>
                <select
                  id="pt-type"
                  value={formData.sourcePartnerType}
                  onChange={(e) => setFormData({ ...formData, sourcePartnerType: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COMMON_PARTNER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Quốc gia */}
              <div>
                <label htmlFor="pt-country" className="block font-medium text-foreground mb-1">
                  Quốc gia <span className="text-red-500">*</span>
                </label>
                <select
                  id="pt-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COMMON_COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Mã số thuế */}
              <div>
                <label htmlFor="pt-tax" className="block font-medium text-foreground mb-1">
                  Mã số thuế (MST)
                </label>
                <input
                  id="pt-tax"
                  type="text"
                  placeholder="VD: 0300816663, 4001207438"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* 7. Người đại diện */}
              <div>
                <label htmlFor="pt-rep" className="block font-medium text-foreground mb-1">
                  Người đại diện pháp luật
                </label>
                <input
                  id="pt-rep"
                  type="text"
                  placeholder="VD: Ông Bùi Minh Trực, Bà Nguyễn Thị Lan"
                  value={formData.representedBy}
                  onChange={(e) => setFormData({ ...formData, representedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 8. Địa chỉ trụ sở / kho bãi */}
              <div className="sm:col-span-2">
                <label htmlFor="pt-address" className="block font-medium text-foreground mb-1">
                  Địa chỉ trụ sở / Kho bãi / Cảng
                </label>
                <input
                  id="pt-address"
                  type="text"
                  placeholder="VD: KCN Cảng Chu Lai, Xã Tam Hiệp, Huyện Núi Thành, Tỉnh Quảng Nam"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 9. Tọa độ GPS */}
              <div className="sm:col-span-2">
                <label htmlFor="pt-gps" className="block font-medium text-foreground mb-1">
                  Tọa độ GPS (Google Maps Coordinates)
                </label>
                <input
                  id="pt-gps"
                  type="text"
                  placeholder="VD: 15.485123, 108.683456"
                  value={formData.gpsCoordinates}
                  onChange={(e) => setFormData({ ...formData, gpsCoordinates: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* 10. Điện thoại */}
              <div>
                <label htmlFor="pt-phone" className="block font-medium text-foreground mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  id="pt-phone"
                  type="text"
                  placeholder="VD: 0235 3567 888"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* 11. Email */}
              <div>
                <label htmlFor="pt-email" className="block font-medium text-foreground mb-1">
                  Email liên hệ / Hóa đơn
                </label>
                <input
                  id="pt-email"
                  type="email"
                  placeholder="VD: ketoan@thilogi.vn, info@pepsico.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 12. Tài khoản ngân hàng */}
              <div>
                <label htmlFor="pt-bank-acc" className="block font-medium text-foreground mb-1">
                  Số tài khoản ngân hàng
                </label>
                <input
                  id="pt-bank-acc"
                  type="text"
                  placeholder="VD: 19028374829101"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* 13. Tên ngân hàng */}
              <div>
                <label htmlFor="pt-bank-name" className="block font-medium text-foreground mb-1">
                  Ngân hàng mở tài khoản
                </label>
                <input
                  id="pt-bank-name"
                  type="text"
                  placeholder="VD: Vietcombank - CN Chu Lai"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 14. Ghi chú nội bộ */}
              <div className="sm:col-span-2">
                <label htmlFor="pt-note" className="block font-medium text-foreground mb-1">
                  Ghi chú nội bộ
                </label>
                <textarea
                  id="pt-note"
                  rows={2}
                  placeholder="Ghi chú về đầu mối liên hệ, lưu ý vận chuyển đặc thù..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 15. Trạng thái hoạt động pháp nhân */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-background border border-border">
                  <input
                    type="checkbox"
                    checked={formData.status === "ACTIVE"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.checked ? "ACTIVE" : "INACTIVE",
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-border cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-foreground text-xs block">
                      Đang hoạt động (ACTIVE)
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Bỏ chọn để tạm dừng giao dịch và ẩn đối tác khỏi danh sách điều vận nhanh.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={formSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={formSubmitting}>
                {isEditing ? "Lưu thay đổi" : "Tạo đối tác"}
              </Button>
            </div>
          </form>
    </ModalDialog>
  );
}
