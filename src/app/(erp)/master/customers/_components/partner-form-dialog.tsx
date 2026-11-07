"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { savePartnerAction } from "@/features/master-data/actions";
import {
  DEFAULT_PARTNER_FORM,
  COMMON_PARTNER_TYPES,
  COMMON_COUNTRIES,
  PAYMENT_TERMS_OPTIONS,
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
          isCustomer: initialData.isCustomer || initialData.customerRoleStatus === "ACTIVE",
          paymentTermsDays: initialData.paymentTermsDays ?? 30,
          creditLimitVnd: initialData.creditLimitVnd ?? null,
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
        isCustomer: formData.isCustomer,
        paymentTermsDays: formData.paymentTermsDays,
        creditLimitVnd: formData.creditLimitVnd,
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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-150" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl animate-in zoom-in-95 duration-150 focus:outline-none font-sans">
          {/* Header Dialog */}
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>{isEditing ? "Chỉnh sửa hồ sơ đối tác" : "Thêm mới đối tác"}</span>
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                Cập nhật thông tin pháp nhân đối tác, phân loại dịch vụ và cấu hình hạn mức tín dụng thương mại.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Mã đối tác */}
              <div>
                <label htmlFor="pt-id" className="block font-medium text-foreground mb-1">
                  Mã đối tác (ID) <span className="text-red-500">*</span>
                </label>
                <input
                  id="pt-id"
                  type="text"
                  placeholder="VD: PEPSI-BNI, HOANG_PHUC, THACO_AUTO"
                  disabled={isEditing}
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono uppercase font-bold disabled:opacity-60 disabled:bg-muted"
                />
              </div>

              {/* 2. Tên viết tắt */}
              <div>
                <label htmlFor="pt-short" className="block font-medium text-foreground mb-1">
                  Tên viết tắt (Short Name)
                </label>
                <input
                  id="pt-short"
                  type="text"
                  placeholder="VD: PEPSICO, THACO AUTO, HOÀNG PHÚC"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              {/* 3. Tên pháp nhân đầy đủ */}
              <div className="sm:col-span-2">
                <label htmlFor="pt-name" className="block font-medium text-foreground mb-1">
                  Tên pháp nhân công ty <span className="text-red-500">*</span>
                </label>
                <input
                  id="pt-name"
                  type="text"
                  placeholder="VD: CÔNG TY TNHH NƯỚC GIẢI KHÁT SUNTORY PEPSICO VIỆT NAM"
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
                  Mã số thuế
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
                  Địa chỉ trụ sở / Nhà máy
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

              {/* 9. Điện thoại */}
              <div>
                <label htmlFor="pt-phone" className="block font-medium text-foreground mb-1">
                  Số điện thoại
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

              {/* 10. Email */}
              <div>
                <label htmlFor="pt-email" className="block font-medium text-foreground mb-1">
                  Email liên hệ / Nhận hóa đơn
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

              {/* 11. Cấu hình vai trò Khách hàng (Customer Role) */}
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-background border border-border space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCustomer}
                    onChange={(e) => setFormData({ ...formData, isCustomer: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-border cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-foreground text-xs block">
                      Kích hoạt vai trò Khách hàng (Customer Role: Active)
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Đối tác được cấp quyền mua dịch vụ vận tải và phát sinh giao dịch thương mại.
                    </span>
                  </div>
                </label>

                {formData.isCustomer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Hạn nợ thương mại:
                      </label>
                      <select
                        value={formData.paymentTermsDays}
                        onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {PAYMENT_TERMS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1">
                        Hạn mức tín dụng tối đa (VND):
                      </label>
                      <CurrencyInput
                        value={formData.creditLimitVnd === null || formData.creditLimitVnd === undefined ? undefined : Number(formData.creditLimitVnd)}
                        onValueChange={(val) => setFormData({ ...formData, creditLimitVnd: val !== undefined ? val : null })}
                        placeholder="Để trống: Không áp dụng"
                        className="w-full text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 12. Trạng thái hoạt động pháp nhân */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-background border border-border">
                  <input
                    type="checkbox"
                    checked={formData.status === "ACTIVE"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? "ACTIVE" : "INACTIVE" })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-border cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-foreground text-xs block">
                      Kích hoạt hoạt động pháp nhân này (Active)
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Khi tắt, đối tác sẽ ở trạng thái ngừng hoạt động và không thể sử dụng trên các phân hệ.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" type="button" disabled={formSubmitting}>
                  Hủy
                </Button>
              </Dialog.Close>
              <Button variant="primary" size="sm" type="submit" loading={formSubmitting}>
                {isEditing ? "Lưu thay đổi" : "Tạo đối tác"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

