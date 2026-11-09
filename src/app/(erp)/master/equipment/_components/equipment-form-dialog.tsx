"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import {
  Snowflake,
  Layers,
} from "lucide-react";
import {
  MasterEquipmentTypeItem,
  CATEGORY_OPTIONS,
} from "./types";
import { saveEquipmentTypeAction } from "@/features/master-data/actions";

interface EquipmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MasterEquipmentTypeItem | null;
  onSuccess: () => void;
}

interface FormData {
  equipmentTypeId: string;
  equipmentName: string;
  category: string;
  isReefer: boolean;
  aliasesText: string;
  sortOrder: number;
  isActive: boolean;
}

function getInitialForm(item: MasterEquipmentTypeItem | null): FormData {
  if (item) {
    return {
      equipmentTypeId: item.equipmentTypeId,
      equipmentName: item.equipmentName,
      category: item.category,
      isReefer: Boolean(item.isReefer),
      aliasesText: (item.aliases || []).join(", "),
      sortOrder: item.sortOrder || 1,
      isActive: Boolean(item.isActive),
    };
  }

  return {
    equipmentTypeId: "",
    equipmentName: "",
    category: "REEFER_CONT",
    isReefer: false,
    aliasesText: "",
    sortOrder: 10,
    isActive: true,
  };
}

export function EquipmentFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: EquipmentFormDialogProps) {
  const isEditing = Boolean(item);
  const [formData, setFormData] = useState<FormData>(() => getInitialForm(item));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state khi open modal
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFormData(getInitialForm(item));
      setErrors({});
    }
    onOpenChange(isOpen);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.equipmentTypeId.trim()) {
      errs.equipmentTypeId = "Vui lòng nhập mã thiết bị (ví dụ: 40HR, 20GP).";
    }
    if (!formData.equipmentName.trim()) {
      errs.equipmentName = "Vui lòng nhập tên loại thiết bị.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const parsedAliases = formData.aliasesText
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      if (!parsedAliases.includes(formData.equipmentTypeId.trim().toUpperCase())) {
        parsedAliases.unshift(formData.equipmentTypeId.trim().toUpperCase());
      }

      const res = await saveEquipmentTypeAction({
        equipmentTypeId: formData.equipmentTypeId.trim().toUpperCase(),
        equipmentName: formData.equipmentName.trim(),
        category: formData.category,
        isReefer: formData.isReefer,
        aliases: parsedAliases,
        sortOrder: Number(formData.sortOrder) || 0,
        isActive: formData.isActive,
      });

      if (!res.success) throw new Error(res.error);

      toast.success(res.message || "Lưu loại thiết bị thành công.");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu loại thiết bị");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isEditing ? `Chỉnh sửa: ${item?.equipmentTypeId}` : "Thêm mới Loại Thiết bị / Container"}
      description={
        isEditing
          ? "Cập nhật tên, quy cách và mã tương đương của thiết bị."
          : "Định nghĩa loại container hoặc phương tiện vận tải mới vào cơ sở dữ liệu."
      }
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mã thiết bị */}
          <div>
            <label className="block text-foreground font-semibold mb-1">
              Mã Thiết Bị (Code) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={isEditing}
              value={formData.equipmentTypeId}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, equipmentTypeId: e.target.value.toUpperCase() }));
                if (errors.equipmentTypeId) setErrors((prev) => ({ ...prev, equipmentTypeId: "" }));
              }}
              placeholder="VD: 40HR, 20GP, 40OT, TRUCK_8T..."
              className={`w-full px-3 py-2 rounded-lg border bg-surface text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.equipmentTypeId ? "border-red-500" : "border-border"
              } ${isEditing ? "opacity-60 cursor-not-allowed bg-muted/40" : ""}`}
            />
            {errors.equipmentTypeId && (
              <p className="text-red-500 text-[11px] mt-1">{errors.equipmentTypeId}</p>
            )}
          </div>

          {/* Phân loại */}
          <div>
            <label className="block text-foreground font-semibold mb-1">
              Phân Nhóm Thiết Bị <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => {
                const cat = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  category: cat,
                  isReefer: cat === "REEFER_CONT" ? true : prev.isReefer,
                }));
              }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.filter((c) => c.id !== "ALL").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tên loại thiết bị */}
        <div>
          <label className="block text-foreground font-semibold mb-1">
            Tên Loại Thiết Bị &amp; Quy Cách <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.equipmentName}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, equipmentName: e.target.value }));
              if (errors.equipmentName) setErrors((prev) => ({ ...prev, equipmentName: "" }));
            }}
            placeholder="VD: Container 40' Lạnh Cao (40HR / 40RH)..."
            className={`w-full px-3 py-2 rounded-lg border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.equipmentName ? "border-red-500" : "border-border"
            }`}
          />
          {errors.equipmentName && (
            <p className="text-red-500 text-[11px] mt-1">{errors.equipmentName}</p>
          )}
        </div>

        {/* Container lạnh cờ toggle */}
        <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-cyan-600 shrink-0" />
            <div>
              <span className="font-semibold text-foreground block">
                Container Lạnh (Reefer)
              </span>
              <span className="text-muted-foreground text-[11px]">
                Tự động kiểm tra phụ phí THC Cảng lạnh và phí cắm điện bãi cảng Chu Lai.
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isReefer}
              onChange={(e) => setFormData((prev) => ({ ...prev, isReefer: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2672df]"></div>
          </label>
        </div>

        {/* Danh sách Aliases */}
        <div>
          <label className="block text-foreground font-semibold mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Mã Tương Đương (Aliases - phân tách bằng dấu phẩy)
          </label>
          <input
            type="text"
            value={formData.aliasesText}
            onChange={(e) => setFormData((prev) => ({ ...prev, aliasesText: e.target.value }))}
            placeholder="VD: 40RH, 40HR, 40RF..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-muted-foreground text-[11px] mt-1">
            Ví dụ: nếu nhập `40RH, 40HR`, khi nhân viên chọn 40RH hệ thống vẫn tra khớp biểu giá 40HR của cảng hoặc hãng tàu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Thứ tự sắp xếp */}
          <div>
            <label className="block text-foreground font-semibold mb-1">
              Thứ Tự Hiển Thị
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={formData.sortOrder}
              onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Trạng thái áp dụng */}
          <div>
            <label className="block text-foreground font-semibold mb-1">
              Trạng Thái Áp Dụng
            </label>
            <select
              value={formData.isActive ? "true" : "false"}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === "true" }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="true">Đang áp dụng (Active)</option>
              <option value="false">Tạm dừng (Inactive)</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="bg-[#2672df] hover:bg-blue-600 text-white font-semibold"
          >
            {isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật thiết bị" : "Lưu thiết bị"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}

