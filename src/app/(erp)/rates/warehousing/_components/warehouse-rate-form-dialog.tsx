"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Warehouse, Building, Tag, Calendar, Clock } from "lucide-react";
import {
  WarehouseRateItem,
  SaveWarehouseRateInput,
  WAREHOUSE_TYPE_OPTIONS,
  SERVICE_CODE_OPTIONS,
  RATE_BASIS_OPTIONS,
} from "./types";
import {
  saveWarehouseRateAction,
  getCommoditiesAction,
} from "@/features/master-data/actions";

interface WarehouseRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate?: WarehouseRateItem | null;
  providerOptions: { providerId: string; providerName: string }[];
  warehouseOptions: { locationId: string; locationName: string; locationType: string }[];
  commodityOptions?: { id: string; name: string }[];
  onSuccess: () => void;
}

export function WarehouseRateFormDialog({
  open,
  onOpenChange,
  rate,
  providerOptions,
  warehouseOptions,
  commodityOptions,
  onSuccess,
}: WarehouseRateFormDialogProps) {
  if (!open) return null;

  const instanceKey = rate ? rate.rateId : "new";

  return (
    <WarehouseRateFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      rate={rate}
      providerOptions={providerOptions}
      warehouseOptions={warehouseOptions}
      commodityOptions={commodityOptions}
      onSuccess={onSuccess}
    />
  );
}

function WarehouseRateFormDialogContent({
  open,
  onOpenChange,
  rate,
  providerOptions,
  warehouseOptions,
  commodityOptions: initialCommodities = [],
  onSuccess,
}: WarehouseRateFormDialogProps) {
  const isEdit = Boolean(rate?.rateId);

  // Khởi tạo state ban đầu trực tiếp từ rate hoặc options
  const [warehouseId, setWarehouseId] = useState(
    rate?.warehouseId || warehouseOptions[0]?.locationId || ""
  );
  const [providerId, setProviderId] = useState(
    rate?.providerId || providerOptions[0]?.providerId || ""
  );
  const [warehouseType, setWarehouseType] = useState(rate?.warehouseType || "DRY");
  const [serviceCode, setServiceCode] = useState(rate?.serviceCode || "STORAGE");
  const [serviceName, setServiceName] = useState(
    rate?.serviceName || "Phí lưu kho hàng hóa"
  );
  const [commodityId, setCommodityId] = useState<string>(
    rate?.commodityId || "ALL"
  );
  const [rateBasis, setRateBasis] = useState(rate?.rateBasis || "TON_DAY");
  const [unitPrice, setUnitPrice] = useState<number>(rate?.unitPrice || 0);
  const [freeDays, setFreeDays] = useState<number>(rate?.freeDays || 0);
  const [minStorageDays, setMinStorageDays] = useState<number>(rate?.minStorageDays || 1);
  const [minChargeVnd, setMinChargeVnd] = useState<number>(rate?.minChargeVnd || 0);
  const [currency] = useState(rate?.currency || "VND");
  const [validFrom, setValidFrom] = useState(rate?.validFrom || "2026-01-01");
  const [validTo, setValidTo] = useState(rate?.validTo || "2027-01-01");
  const [status, setStatus] = useState(rate?.status || "ACTIVE");
  const [notes, setNotes] = useState(rate?.notes || "");

  const [commodities, setCommodities] = useState<{ id: string; name: string }[]>(initialCommodities);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Nạp danh mục mặt hàng từ database nếu chưa có
  useEffect(() => {
    let isMounted = true;
    if (commodities.length === 0) {
      getCommoditiesAction().then((res) => {
        if (isMounted && res.success && res.data) {
          setCommodities(
            res.data.map((c: { commodityId?: string; id?: string; name: string }) => ({
              id: c.commodityId || c.id || "",
              name: c.name,
            }))
          );
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [commodities.length]);

  // Tự động gợi ý tên dịch vụ khi đổi serviceCode
  const handleServiceCodeChange = (newCode: string) => {
    setServiceCode(newCode);
    const found = SERVICE_CODE_OPTIONS.find((s) => s.id === newCode);
    if (found && found.id !== "ALL") {
      setServiceName(found.label);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!warehouseId) errs.warehouseId = "Vui lòng chọn Kho bãi áp dụng.";
    if (!providerId) errs.providerId = "Vui lòng chọn Đơn vị vận hành kho.";
    if (!serviceName.trim()) errs.serviceName = "Vui lòng nhập tên dịch vụ chi tiết.";
    if (unitPrice < 0) errs.unitPrice = "Đơn giá không được là số âm.";
    if (freeDays < 0) errs.freeDays = "Số ngày miễn phí không được là số âm.";
    if (minStorageDays < 0) errs.minStorageDays = "Số ngày tính tối thiểu không hợp lệ.";
    if (minChargeVnd < 0) errs.minChargeVnd = "Mức cước tối thiểu không được âm.";
    if (!validFrom) errs.validFrom = "Vui lòng chọn ngày bắt đầu hiệu lực.";
    if (!validTo) errs.validTo = "Vui lòng chọn ngày kết thúc hiệu lực.";
    if (validFrom && validTo && validFrom > validTo) {
      errs.validTo = "Ngày kết thúc phải sau ngày bắt đầu.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin có viền đỏ.");
      return;
    }

    const selectedWarehouse = warehouseOptions.find((w) => w.locationId === warehouseId);
    const selectedProvider = providerOptions.find((p) => p.providerId === providerId);
    const selectedCommodity = commodities.find((c) => c.id === commodityId);

    const payload: SaveWarehouseRateInput = {
      rateId: rate?.rateId,
      warehouseId,
      warehouseName: selectedWarehouse?.locationName || warehouseId,
      providerId,
      providerName: selectedProvider?.providerName || providerId,
      warehouseType,
      serviceCode,
      serviceName: serviceName.trim(),
      commodityId: commodityId === "ALL" ? null : commodityId,
      commodityName: commodityId === "ALL" ? "Tất cả loại hàng" : selectedCommodity?.name || "Tất cả loại hàng",
      rateBasis,
      unitPrice,
      freeDays,
      minStorageDays,
      minChargeVnd,
      currency,
      validFrom,
      validTo,
      status,
      notes: notes.trim(),
    };

    setSubmitting(true);
    try {
      const res = await saveWarehouseRateAction(payload);
      if (res.success && "message" in res) {
        toast.success(res.message);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error("error" in res ? res.error : "Không thể lưu biểu phí Kho bãi.");
      }
    } catch {
      toast.error("Có lỗi xảy ra trong quá trình lưu dữ liệu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      title={isEdit ? "Chỉnh sửa Biểu phí Kho bãi & Lưu trữ" : "Thêm mới Biểu phí Kho bãi & Lưu trữ"}
      description="Thiết lập định mức chi phí lưu kho, bốc dỡ, soạn hàng và các dịch vụ giá trị gia tăng tại kho bãi Chu Lai."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phần 1: Kho bãi & Đơn vị vận hành */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
            <Warehouse className="w-4 h-4 text-primary" />
            <span>1. Kho Bãi & Đơn vị Cung Cấp Dịch Vụ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kho bãi */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Kho bãi / Điểm đóng hàng <span className="text-red-500">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  if (errors.warehouseId) setErrors((prev) => ({ ...prev, warehouseId: "" }));
                }}
                className={`w-full bg-background border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${errors.warehouseId ? "border-red-500" : "border-border"
                  }`}
              >
                <option value="">-- Chọn Kho bãi --</option>
                {warehouseOptions.map((w) => (
                  <option key={w.locationId} value={w.locationId}>
                    [{w.locationType}] {w.locationName}
                  </option>
                ))}
              </select>
              {errors.warehouseId && (
                <p className="text-[11px] text-red-500">{errors.warehouseId}</p>
              )}
            </div>

            {/* Đơn vị vận hành */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Đơn vị vận hành / Nhà cung cấp kho <span className="text-red-500">*</span>
              </label>
              <select
                value={providerId}
                onChange={(e) => {
                  setProviderId(e.target.value);
                  if (errors.providerId) setErrors((prev) => ({ ...prev, providerId: "" }));
                }}
                className={`w-full bg-background border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${errors.providerId ? "border-red-500" : "border-border"
                  }`}
              >
                <option value="">-- Chọn Đơn vị vận hành --</option>
                {providerOptions.map((p) => (
                  <option key={p.providerId} value={p.providerId}>
                    {p.providerName}
                  </option>
                ))}
              </select>
              {errors.providerId && (
                <p className="text-[11px] text-red-500">{errors.providerId}</p>
              )}
            </div>
          </div>
        </div>

        {/* Phần 2: Loại kho & Nhóm dịch vụ */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
            <Building className="w-4 h-4 text-primary" />
            <span>2. Loại Kho & Nhóm Dịch Vụ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Loại kho */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Loại kho bãi <span className="text-red-500">*</span>
              </label>
              <select
                value={warehouseType}
                onChange={(e) => setWarehouseType(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {WAREHOUSE_TYPE_OPTIONS.filter((t) => t.id !== "ALL").map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nhóm dịch vụ kho */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Nhóm dịch vụ kho <span className="text-red-500">*</span>
              </label>
              <select
                value={serviceCode}
                onChange={(e) => handleServiceCodeChange(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {SERVICE_CODE_OPTIONS.filter((s) => s.id !== "ALL").map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.id}] {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tên dịch vụ chi tiết */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Tên dịch vụ chi tiết <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => {
                  setServiceName(e.target.value);
                  if (errors.serviceName) setErrors((prev) => ({ ...prev, serviceName: "" }));
                }}
                placeholder="VD: Phí lưu kho mát sầu riêng..."
                className={`w-full bg-background border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${errors.serviceName ? "border-red-500" : "border-border"
                  }`}
              />
              {errors.serviceName && (
                <p className="text-[11px] text-red-500">{errors.serviceName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Phần 3: Mặt hàng áp dụng & Cơ sở tính giá */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
            <Tag className="w-4 h-4 text-primary" />
            <span>3. Mặt Hàng Áp Dụng & Cơ Sở Tính Giá</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mặt hàng - Chọn 100% từ Database Master Data */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Mặt hàng áp dụng <span className="text-red-500">*</span>
              </label>
              <select
                value={commodityId}
                onChange={(e) => setCommodityId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">★ Tất cả loại hàng (Định mức chung)</option>
                {commodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Dữ liệu đồng bộ từ danh mục Hàng hóa chung của THILOGI ERP.
              </p>
            </div>

            {/* Cơ sở tính giá */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Cơ sở tính giá (Rate Basis) <span className="text-red-500">*</span>
              </label>
              <select
                value={rateBasis}
                onChange={(e) => setRateBasis(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {RATE_BASIS_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label} ({b.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Phần 4: Đơn giá, Cơ chế lưu kho & Mức tối thiểu */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span>4. Đơn Giá & Điều Kiện Lưu Kho</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Đơn giá */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Đơn giá ({currency}) <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                value={unitPrice}
                onValueChange={(val) => {
                  setUnitPrice(val ?? 0);
                  if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: "" }));
                }}
                className={`text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 ${errors.unitPrice ? "!border-red-500" : ""
                  }`}
              />
              {errors.unitPrice && (
                <p className="text-[11px] text-red-500">{errors.unitPrice}</p>
              )}
            </div>

            {/* Số ngày miễn phí */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Miễn phí lưu (Ngày)
              </label>
              <input
                type="number"
                min="0"
                value={freeDays}
                onChange={(e) => setFreeDays(Number(e.target.value || 0))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-semibold"
              />
            </div>

            {/* Số ngày tính tối thiểu */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Số ngày tối thiểu (Ngày)
              </label>
              <input
                type="number"
                min="1"
                value={minStorageDays}
                onChange={(e) => setMinStorageDays(Number(e.target.value || 1))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-semibold"
              />
            </div>

            {/* Mức cước tối thiểu */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Mức cước tối thiểu (VND)
              </label>
              <CurrencyInput
                value={minChargeVnd}
                onValueChange={(val) => setMinChargeVnd(val ?? 0)}
                className="text-xs font-mono font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Phần 5: Thời hạn hiệu lực, Trạng thái & Ghi chú */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            <span>5. Thời Hạn Hiệu Lực & Ghi Chú</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ngày bắt đầu */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Hiệu lực từ ngày <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={validFrom}
                onChange={(val) => {
                  setValidFrom(val);
                  if (errors.validFrom) setErrors((prev) => ({ ...prev, validFrom: "" }));
                }}
              />
              {errors.validFrom && (
                <p className="text-[11px] text-red-500">{errors.validFrom}</p>
              )}
            </div>

            {/* Ngày kết thúc */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Hiệu lực đến ngày <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={validTo}
                onChange={(val) => {
                  setValidTo(val);
                  if (errors.validTo) setErrors((prev) => ({ ...prev, validTo: "" }));
                }}
              />
              {errors.validTo && (
                <p className="text-[11px] text-red-500">{errors.validTo}</p>
              )}
            </div>

            {/* Trạng thái */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Trạng thái áp dụng
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="ACTIVE">Đang áp dụng (Active)</option>
                <option value="INACTIVE">Hết hiệu lực (Inactive)</option>
              </select>
            </div>

            {/* Ghi chú */}
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-semibold text-foreground">
                Ghi chú điều kiện nghiệp vụ
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="VD: Áp dụng cho nông sản đóng pallet tiêu chuẩn 1.2m x 1m, bao gồm bảo vệ 24/7..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting}
            className="min-w-[120px]"
          >
            {submitting ? "Đang lưu..." : isEdit ? "Cập nhật biểu phí" : "Tạo mới biểu phí"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
