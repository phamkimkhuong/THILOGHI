"use client";

import { useState } from "react";
import { Package, AlertCircle, Calendar, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { saveCommodityAction } from "@/features/master-data/actions";
import {
  DEFAULT_COMMODITY_FORM,
  COMMON_CATEGORIES,
  COMMON_SPECIFICATIONS,
  COMMON_ORIGINS,
  COMMON_PURPOSES,
  type CommodityFormData,
  type CommodityRecord,
} from "./types";

interface CommodityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: CommodityRecord | null;
  categories: string[];
  currentUserName?: string;
  onSuccess: () => void;
}

export function CommodityFormDialog({
  open,
  onOpenChange,
  initialData,
  categories,
  currentUserName = "Bùi Hiếu",
  onSuccess,
}: CommodityFormDialogProps) {
  const [formData, setFormData] = useState<CommodityFormData>(DEFAULT_COMMODITY_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [prevInitialData, setPrevInitialData] = useState<CommodityRecord | null>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  // Chuẩn React 19: Điều chỉnh state trong render khi prop thay đổi
  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);
    if (open) {
      if (initialData) {
        setFormData({
          commodityId: initialData.commodityId,
          name: initialData.name,
          englishName: initialData.englishName || "",
          category: initialData.category || "Nông sản",
          specifications: initialData.specifications || "Đóng bao",
          components: initialData.components || "",
          origin: initialData.origin || "Việt Nam",
          purpose: initialData.purpose || "Thực phẩm",
          imageUrl: initialData.imageUrl || "",
          note: initialData.note || "",
          status: initialData.status || "Đã duyệt",
        });
      } else {
        setFormData({
          ...DEFAULT_COMMODITY_FORM,
          category: categories[0] || "Nông sản",
        });
      }
      setFormError("");
    }
  }

  const allCategories = Array.from(new Set([...COMMON_CATEGORIES, ...categories])).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Tên hàng hóa không được để trống.");
      return;
    }
    if (!formData.englishName.trim()) {
      setFormError("Tên tiếng Anh (English Name) không được để trống để phục vụ vận đơn và hải quan.");
      return;
    }
    if (!formData.category.trim()) {
      setFormError("Vui lòng chọn loại hàng hóa.");
      return;
    }
    if (!formData.specifications.trim()) {
      setFormError("Vui lòng chọn quy cách đóng gói.");
      return;
    }
    if (!formData.origin.trim()) {
      setFormError("Vui lòng chọn quốc gia xuất xứ.");
      return;
    }
    if (!formData.purpose.trim()) {
      setFormError("Vui lòng chọn mục đích sử dụng.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    try {
      const res = await saveCommodityAction(formData);
      if (!res.success) {
        throw new Error(res.error || "Không thể lưu mặt hàng.");
      }
      toast.success(res.message || "Đã lưu mặt hàng thành công!");
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

  const isActive = formData.status === "Đã duyệt" || formData.status === "Active";

  // Định dạng thời gian tạo hiển thị
  const formatDateTime = (isoDate?: string) => {
    if (!isoDate) {
      return new Date().toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    }
    try {
      return new Date(isoDate).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      icon={Package}
      title={formData.commodityId ? "Chỉnh sửa mặt hàng" : "Thêm mới mặt hàng"}
      description="Thiết lập thông số danh mục mặt hàng chuẩn hóa phục vụ vận tải đường bộ và vận chuyển quốc tế."
    >


          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Tên hàng hóa tiếng Việt */}
              <div className="sm:col-span-2">
                <label htmlFor="comm-name" className="block font-medium text-foreground mb-1">
                  Tên hàng hóa <span className="text-red-500">*</span>
                </label>
                <input
                  id="comm-name"
                  type="text"
                  placeholder="VD: Quả chuối tươi, Tinh bột sắn, Cám bắp, Quặng sắt..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* 2. Tên tiếng Anh */}
              <div className="sm:col-span-2">
                <label htmlFor="comm-english" className="block font-medium text-foreground mb-1">
                  Tên tiếng Anh (English Name) <span className="text-red-500">*</span>
                </label>
                <input
                  id="comm-english"
                  type="text"
                  placeholder="VD: Fresh Bananas, Tapioca, Corn bran, Iron ore..."
                  value={formData.englishName}
                  onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 italic"
                />
              </div>

              {/* 3. Loại hàng */}
              <div>
                <label htmlFor="comm-category" className="block font-medium text-foreground mb-1">
                  Loại hàng <span className="text-red-500">*</span>
                </label>
                <select
                  id="comm-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Quy cách */}
              <div>
                <label htmlFor="comm-spec" className="block font-medium text-foreground mb-1">
                  Quy cách <span className="text-red-500">*</span>
                </label>
                <select
                  id="comm-spec"
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COMMON_SPECIFICATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Thành phần */}
              <div>
                <label htmlFor="comm-components" className="block font-medium text-foreground mb-1">
                  Thành phần
                </label>
                <input
                  id="comm-components"
                  type="text"
                  placeholder="VD: Giấy, Nhựa PVC, Kim loại, Độ ẩm < 51%..."
                  value={formData.components}
                  onChange={(e) => setFormData({ ...formData, components: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 6. Xuất xứ */}
              <div>
                <label htmlFor="comm-origin" className="block font-medium text-foreground mb-1">
                  Xuất xứ <span className="text-red-500">*</span>
                </label>
                <select
                  id="comm-origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COMMON_ORIGINS.map((orig) => (
                    <option key={orig} value={orig}>
                      {orig}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Mục đích */}
              <div>
                <label htmlFor="comm-purpose" className="block font-medium text-foreground mb-1">
                  Mục đích <span className="text-red-500">*</span>
                </label>
                <select
                  id="comm-purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {COMMON_PURPOSES.map((purp) => (
                    <option key={purp} value={purp}>
                      {purp}
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. Ghi chú */}
              <div className="sm:col-span-2">
                <label htmlFor="comm-note" className="block font-medium text-foreground mb-1">
                  Ghi chú
                </label>
                <textarea
                  id="comm-note"
                  rows={2}
                  placeholder="VD: Yêu cầu bạt che chống ướt, nhiệt độ bảo quản 13-14°C đối với xe lạnh, hướng dẫn bốc xếp an toàn..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs resize-none"
                />
              </div>

              {/* 9. Trạng thái hoạt động (Quản trị tập trung - Active/Inactive) */}
              <div className="sm:col-span-2 pt-2 border-t border-border">
                <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-background border border-border hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked ? "Đã duyệt" : "Tạm ngưng" })
                    }
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-border cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-foreground text-xs block">
                      Kích hoạt sử dụng mặt hàng này ngay (Active)
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Mặt hàng ở trạng thái kích hoạt sẽ hiển thị trực tiếp trong danh sách chọn của phân hệ Báo giá và Đơn vận chuyển.
                    </span>
                  </div>
                </label>
              </div>

              {/* 10. Audit Log (Read-only hiển thị thời gian & người tạo) */}
              <div className="sm:col-span-2 p-3 rounded-xl bg-surface border border-border grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Thời gian tạo:</span>
                  <strong className="text-foreground font-mono">
                    {formatDateTime(initialData?.createdAt)}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Người tạo:</span>
                  <strong className="text-foreground">
                    {initialData?.createdBy || currentUserName}
                  </strong>
                </div>
              </div>
            </div>

            {/* Footer nút hành động */}
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
                {formData.commodityId ? "Lưu thay đổi" : "Tạo mặt hàng"}
              </Button>
            </div>
          </form>
    </ModalDialog>
  );
}
