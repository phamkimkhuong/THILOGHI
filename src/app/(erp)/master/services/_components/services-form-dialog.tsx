"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import {
  Layers,
  FileText,
  Calculator,
  Tag,
  Building2,
  CheckCircle2,
} from "lucide-react";
import {
  MasterServicePackage,
  SaveServicePackageInput,
  CATEGORIES_LIST,
} from "./types";
import { saveServicePackageAction } from "@/features/master-data/actions";

interface ServicesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: MasterServicePackage | null;
  onSuccess: () => void;
}

function getInitialForm(service: MasterServicePackage | null): SaveServicePackageInput {
  if (service) {
    return {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      serviceCategory: service.serviceCategory,
      description: service.description || "",
      defaultUnit: service.defaultUnit || "TRIP",
      pricingType: service.pricingType || "ROUTE_BASED",
      isCoreTransport: Boolean(service.isCoreTransport),
      isActive: Boolean(service.isActive),
      sortOrder: service.sortOrder || 1,
      typicalCharges: service.typicalCharges || [],
    };
  }

  return {
    serviceId: "",
    serviceName: "",
    serviceCategory: "CORE_TRANSPORT",
    description: "",
    defaultUnit: "TRIP",
    pricingType: "ROUTE_BASED",
    isCoreTransport: false,
    isActive: true,
    sortOrder: 9,
    typicalCharges: [],
  };
}

export function ServicesFormDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServicesFormDialogProps) {
  if (!open) return null;

  const instanceKey = service ? service.serviceId : "new";

  return (
    <ServicesFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      service={service}
      onSuccess={onSuccess}
    />
  );
}

function ServicesFormDialogContent({
  open,
  onOpenChange,
  service,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: MasterServicePackage | null;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(service);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<SaveServicePackageInput>(() =>
    getInitialForm(service)
  );
  const [chargesInput, setChargesInput] = useState<string>(
    (formData.typicalCharges || []).join(", ")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const parsedCharges = chargesInput
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      const payload: SaveServicePackageInput = {
        ...formData,
        typicalCharges: parsedCharges,
      };

      const res = await saveServicePackageAction(payload);
      if (!res.success) {
        throw new Error(res.error);
      }

      toast.success(res.message);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Chỉnh sửa gói dịch vụ ${service?.serviceId}` : "Thêm mới gói dịch vụ chuẩn"}
      description="Cấu hình thông số thương mại, nhóm phân loại và phương thức tính cước"
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Mã gói dịch vụ */}
          <div>
            <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Mã Gói Dịch Vụ (Code)</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              placeholder="VD: TRUCKING, OCEAN, PORT..."
              value={formData.serviceId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  serviceId: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
            />
          </div>

          {/* Tên dịch vụ */}
          <div>
            <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Tên Dịch Vụ (Tiếng Việt)</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Vận tải đường bộ, Cảng & Depot..."
              value={formData.serviceName}
              onChange={(e) =>
                setFormData({ ...formData, serviceName: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Phân nhóm dịch vụ */}
          <div>
            <label className="font-medium text-foreground mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Phân nhóm</span>
            </label>
            <select
              value={formData.serviceCategory}
              onChange={(e) =>
                setFormData({ ...formData, serviceCategory: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CATEGORIES_LIST.filter((c) => c.id !== "ALL").map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Phương thức tính cước */}
          <div>
            <label className="font-medium text-foreground mb-1 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span>Cách tính cước</span>
            </label>
            <select
              value={formData.pricingType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricingType: e.target.value as "ROUTE_BASED" | "UNIT_BASED",
                })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ROUTE_BASED">Theo tuyến (A → B + Thiết bị)</option>
              <option value="UNIT_BASED">Theo đơn vị / Lần tác nghiệp</option>
            </select>
          </div>

          {/* Đơn vị tính mặc định */}
          <div>
            <label className="font-medium text-foreground mb-1 block">
              Đơn vị tính mặc định
            </label>
            <input
              type="text"
              required
              placeholder="VD: TRIP, CONT, LOT..."
              value={formData.defaultUnit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultUnit: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cấu hình nâng cao: Core Transport & Thứ tự & Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3 rounded-xl bg-muted/20 border border-border">
          {/* Vận tải chính (Core) */}
          <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
            <input
              type="checkbox"
              checked={formData.isCoreTransport}
              onChange={(e) =>
                setFormData({ ...formData, isCoreTransport: e.target.checked })
              }
              className="rounded border-border text-primary focus:ring-blue-500 w-4 h-4"
            />
            <span>Là dịch vụ vận tải chính (Core)</span>
          </label>

          {/* Hoạt động */}
          <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="rounded border-border text-primary focus:ring-blue-500 w-4 h-4"
            />
            <span>Kích hoạt hoạt động</span>
          </label>

          {/* Thứ tự hiển thị */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground whitespace-nowrap">Thứ tự:</span>
            <input
              type="number"
              min="1"
              max="99"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({ ...formData, sortOrder: Number(e.target.value) || 1 })
              }
              className="w-20 px-2 py-1 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Mô tả nghiệp vụ */}
        <div>
          <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Mô tả &amp; Phạm vi nghiệp vụ</span>
          </label>
          <textarea
            rows={3}
            placeholder="Mô tả phạm vi thực hiện, phương tiện sử dụng, trách nhiệm vận hành..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Các mã phụ phí thành phần */}
        <div>
          <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span>Các chi phí thành phần (Charges &amp; Surcharges)</span>
          </label>
          <input
            type="text"
            placeholder="Nhập các mã phân cách bằng dấu phẩy: LOLO, POWER, THC_PORT..."
            value={chargesInput}
            onChange={(e) => setChargesInput(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Nhập các mã phụ phí nếu có (phân cách bằng dấu phẩy).
          </p>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={submitting}
            className="flex items-center gap-1.5 font-semibold shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isEdit ? "Cập nhật dịch vụ" : "Lưu gói dịch vụ"}</span>
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}

