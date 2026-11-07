"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveCommodityAction } from "@/features/master-data/actions";
import {
  DEFAULT_COMMODITY_FORM,
  COMMON_CATEGORIES,
  COMMON_SPECIFICATIONS,
  type CommodityFormData,
  type CommodityRecord,
} from "./types";

interface CommodityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: CommodityRecord | null;
  categories: string[];
  onSuccess: () => void;
}

export function CommodityFormDialog({
  open,
  onOpenChange,
  initialData,
  categories,
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
          specifications: initialData.specifications || "",
          components: initialData.components || "",
          origin: initialData.origin || "Việt Nam",
          purpose: initialData.purpose || "",
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
    if (!formData.category.trim()) {
      setFormError("Vui lòng chọn nhóm phân loại hàng hóa.");
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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-150" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl animate-in zoom-in-95 duration-150 focus:outline-none font-sans">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div>
              <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>{formData.commodityId ? "Chỉnh sửa mặt hàng" : "Thêm mới mặt hàng"}</span>
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                Cập nhật thông số danh mục mặt hàng phục vụ vận tải đường bộ và vận chuyển quốc tế.
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
              {/* Tên hàng hóa tiếng Việt */}
              <div className="sm:col-span-2">
                <label htmlFor="comm-name" className="block font-medium text-foreground mb-1">
                  Tên hàng hóa (Tiếng Việt) <span className="text-red-500">*</span>
                </label>
                <input
                  id="comm-name"
                  type="text"
                  placeholder="VD: Quả chuối tươi, Tinh bột sắn, Xe xúc lật"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Tên tiếng Anh */}
              <div className="sm:col-span-2">
                <label htmlFor="comm-english" className="block font-medium text-foreground mb-1">
                  Tên tiếng Anh (English Name - Dùng cho vận đơn & hải quan)
                </label>
                <input
                  id="comm-english"
                  type="text"
                  placeholder="VD: Fresh Bananas, Tapioca, Dump Truck"
                  value={formData.englishName}
                  onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 italic"
                />
              </div>

              {/* Nhóm / Phân loại */}
              <div>
                <label htmlFor="comm-category" className="block font-medium text-foreground mb-1">
                  Nhóm phân loại <span className="text-red-500">*</span>
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

              {/* Quy cách đóng gói */}
              <div>
                <label htmlFor="comm-spec" className="block font-medium text-foreground mb-1">
                  Quy cách đóng gói
                </label>
                <input
                  id="comm-spec"
                  type="text"
                  list="spec-suggestions"
                  placeholder="VD: Đóng bao, Đóng thùng Carton..."
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <datalist id="spec-suggestions">
                  {COMMON_SPECIFICATIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Quốc gia xuất xứ */}
              <div>
                <label htmlFor="comm-origin" className="block font-medium text-foreground mb-1">
                  Quốc gia xuất xứ
                </label>
                <select
                  id="comm-origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Việt Nam">Việt Nam 🇻🇳</option>
                  <option value="Lào">Lào 🇱🇦</option>
                  <option value="Campuchia">Campuchia 🇰🇭</option>
                  <option value="Trung Quốc">Trung Quốc 🇨🇳</option>
                  <option value="Belarus">Belarus 🇧🇾</option>
                  <option value="Brunei">Brunei 🇧🇳</option>
                  <option value="Khác">Quốc gia khác</option>
                </select>
              </div>

              {/* Mục đích sử dụng */}
              <div>
                <label htmlFor="comm-purpose" className="block font-medium text-foreground mb-1">
                  Mục đích sử dụng
                </label>
                <input
                  id="comm-purpose"
                  type="text"
                  placeholder="VD: Thực phẩm, Chăm sóc cây, Xây dựng..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Thành phần cấu tạo */}
              <div>
                <label htmlFor="comm-components" className="block font-medium text-foreground mb-1">
                  Thành phần cấu tạo
                </label>
                <input
                  id="comm-components"
                  type="text"
                  placeholder="VD: Giấy, Hạt nhựa, Kim loại..."
                  value={formData.components}
                  onChange={(e) => setFormData({ ...formData, components: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Trạng thái phê duyệt */}
              <div>
                <label htmlFor="comm-status" className="block font-medium text-foreground mb-1">
                  Trạng thái áp dụng
                </label>
                <select
                  id="comm-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="Đã duyệt">Đã duyệt (Active)</option>
                  <option value="Tạm ngưng">Tạm ngưng (Inactive)</option>
                </select>
              </div>

              {/* Ghi chú nghiệp vụ */}
              <div className="sm:col-span-2">
                <label htmlFor="comm-note" className="block font-medium text-foreground mb-1">
                  Ghi chú nghiệp vụ & Hướng dẫn xếp dỡ
                </label>
                <textarea
                  id="comm-note"
                  rows={2}
                  placeholder="VD: Yêu cầu che bạt chống ướt, nhiệt độ bảo quản 13-14 độ C đối với container lạnh..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs resize-none"
                />
              </div>
            </div>

            {/* Footer nút hành động */}
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" type="button" disabled={formSubmitting}>
                  Hủy
                </Button>
              </Dialog.Close>
              <Button variant="primary" size="sm" type="submit" loading={formSubmitting}>
                {formData.commodityId ? "Lưu thay đổi" : "Tạo mặt hàng"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

