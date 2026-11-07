"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { saveLocationAction } from "@/features/master-data/actions";
import {
  DEFAULT_FORM_DATA,
  LOCATION_TYPES,
  type LocationFormData,
  type LocationRecord,
  type RegionRecord,
} from "./types";

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: LocationRecord | null;
  regions: RegionRecord[];
  onSuccess: () => void;
}

export function LocationFormDialog({
  open,
  onOpenChange,
  initialData,
  regions,
  onSuccess,
}: LocationFormDialogProps) {
  const [formData, setFormData] = useState<LocationFormData>(DEFAULT_FORM_DATA);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [prevInitialData, setPrevInitialData] = useState<LocationRecord | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  // Chuẩn React 19: Điều chỉnh state trong render khi prop thay đổi thay vì gọi setState trong useEffect
  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);
    if (open) {
      if (initialData) {
        setFormData({
          locationId: initialData.locationId,
          code: initialData.code,
          name: initialData.name,
          locationType: initialData.locationType,
          regionId: initialData.regionId,
          countryCode: initialData.countryCode || "VN",
          province: initialData.province || "",
          address: initialData.address || "",
          gpsCoordinates: initialData.gpsCoordinates || "",
          company: initialData.company || "",
          contact: initialData.contact || "",
          note: initialData.note || "",
          commodities: initialData.commodities || "",
          isActive: initialData.isActive,
        });
      } else {
        setFormData({
          ...DEFAULT_FORM_DATA,
          regionId: regions[0]?.id || "",
        });
      }
      setFormError("");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError("Mã địa điểm không được để trống.");
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Tên địa điểm không được để trống.");
      return;
    }
    if (!formData.regionId) {
      setFormError("Vui lòng chọn phân vùng logistics.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    try {
      const res = await saveLocationAction(formData);
      if (!res.success) {
        throw new Error(res.error || "Không thể lưu địa điểm.");
      }
      toast.success(res.message || "Đã lưu địa điểm thành công!");
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
      icon={MapPin}
      title={formData.locationId ? "Chỉnh sửa địa điểm logistics" : "Thêm mới địa điểm logistics"}
      description="Điền các thông số cơ sở logistics, kho bãi, cảng biển, depot để cập nhật vào hệ thống."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
            {formError}
          </div>
        )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Mã địa điểm */}
              <div>
                <label htmlFor="form-code" className="block font-medium text-foreground mb-1">
                  Mã địa điểm (Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-code"
                  type="text"
                  required
                  placeholder="VD: KHO_DN, CHULAI_PORT"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Tên địa điểm */}
              <div>
                <label htmlFor="form-name" className="block font-medium text-foreground mb-1">
                  Tên địa điểm <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-name"
                  type="text"
                  required
                  placeholder="VD: Kho Nông Trường Snuol"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Loại hình */}
              <div>
                <label htmlFor="form-type" className="block font-medium text-foreground mb-1">
                  Loại hình địa điểm <span className="text-rose-500">*</span>
                </label>
                <select
                  id="form-type"
                  value={formData.locationType}
                  onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {LOCATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phân vùng logistics */}
              <div>
                <label htmlFor="form-region" className="block font-medium text-foreground mb-1">
                  Phân vùng logistics <span className="text-rose-500">*</span>
                </label>
                <select
                  id="form-region"
                  required
                  value={formData.regionId}
                  onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Chọn phân vùng…</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quốc gia */}
              <div>
                <label htmlFor="form-country" className="block font-medium text-foreground mb-1">
                  Quốc gia
                </label>
                <select
                  id="form-country"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="VN">Việt Nam (VN) 🇻🇳</option>
                  <option value="LA">Lào (LA) 🇱🇦</option>
                  <option value="KH">Campuchia (KH) 🇰🇭</option>
                  <option value="CN">Trung Quốc (CN) 🇨🇳</option>
                </select>
              </div>

              {/* Tỉnh / Thành phố */}
              <div>
                <label htmlFor="form-province" className="block font-medium text-foreground mb-1">
                  Tỉnh / Thành phố
                </label>
                <input
                  id="form-province"
                  type="text"
                  placeholder="VD: Ratanakiri, Attapeu, Quảng Nam"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Đơn vị / Pháp nhân quản lý */}
              <div>
                <label htmlFor="form-company" className="block font-medium text-foreground mb-1">
                  Đơn vị / Doanh nghiệp chủ quản
                </label>
                <input
                  id="form-company"
                  type="text"
                  placeholder="VD: THILOGI, AGRI, GGT, TTC-BHO"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Thông tin liên hệ (Contact) */}
              <div>
                <label htmlFor="form-contact" className="block font-medium text-foreground mb-1">
                  Người liên hệ / Số điện thoại (Contact)
                </label>
                <input
                  id="form-contact"
                  type="text"
                  placeholder="VD: Ms Lộc - 0903598006, 0824224422"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Mặt hàng phụ trách (Commodities) */}
              <div>
                <label htmlFor="form-commodities" className="block font-medium text-foreground mb-1">
                  Mặt hàng phụ trách (Commodities)
                </label>
                <input
                  id="form-commodities"
                  type="text"
                  placeholder="VD: Quả chuối tươi, Đường tinh luyện, Sữa tiệt trùng"
                  value={formData.commodities}
                  onChange={(e) => setFormData({ ...formData, commodities: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Tọa độ GPS */}
              <div>
                <label htmlFor="form-gps" className="block font-medium text-foreground mb-1">
                  Tọa độ GPS (Vĩ độ, Kinh độ)
                </label>
                <input
                  id="form-gps"
                  type="text"
                  placeholder="VD: 13.436488, 106.977858"
                  value={formData.gpsCoordinates}
                  onChange={(e) => setFormData({ ...formData, gpsCoordinates: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Địa chỉ chi tiết */}
              <div className="sm:col-span-2">
                <label htmlFor="form-address" className="block font-medium text-foreground mb-1">
                  Địa chỉ chi tiết
                </label>
                <input
                  id="form-address"
                  type="text"
                  placeholder="VD: Xã Tam Hiệp, Huyện Núi Thành, Tỉnh Quảng Nam"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Ghi chú nghiệp vụ / Tên pháp nhân đầy đủ (Note) */}
              <div className="sm:col-span-2">
                <label htmlFor="form-note" className="block font-medium text-foreground mb-1">
                  Ghi chú nghiệp vụ / Tên pháp nhân đầy đủ (Note)
                </label>
                <textarea
                  id="form-note"
                  rows={2}
                  placeholder="VD: CN CÔNG TY TNHH NƯỚC GIẢI KHÁT SUNTORY PEPSICO VIỆT NAM TẠI BẮC NINH"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs resize-none"
                />
              </div>

              {/* Trạng thái hoạt động */}
              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  id="form-active"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="form-active" className="font-medium text-foreground cursor-pointer">
                  Kích hoạt hoạt động địa điểm này trên hệ thống
                </label>
              </div>
            </div>

            {/* Footer nút hành động modal */}
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={formSubmitting}
              >
                Hủy
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={formSubmitting}>
                {formData.locationId ? "Lưu thay đổi" : "Tạo địa điểm"}
              </Button>
            </div>
          </form>
    </ModalDialog>
  );
}