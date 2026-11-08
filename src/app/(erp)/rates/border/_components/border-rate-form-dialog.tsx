"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ShieldCheck, DollarSign, Calculator } from "lucide-react";
import {
  BorderRateItem,
  SaveBorderRateInput,
  STANDARD_BORDER_PAIRS,
  formatCurrency,
} from "./types";
import { saveBorderRateAction, getCommoditiesAction } from "@/features/master-data/actions";

interface BorderRateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: BorderRateItem | null;
  commodityOptions?: string[];
  onSuccess: () => void;
}

function getInitialForm(rate: BorderRateItem | null): SaveBorderRateInput {
  if (rate) {
    return {
      rateId: rate.rateId,
      borderPairId: rate.borderPairId || "BOY-PHU",
      borderPairName: rate.borderPairName || "Bờ Y – Phu Kua",
      countryPair: rate.countryPair || "Việt - Lào",
      provinces: rate.provinces || "Kon Tum – Attapeu",
      commodityName: rate.commodityName || "Tất cả loại hàng",
      infrastructureFee: rate.infrastructureFee ?? 0,
      entryExitFee: rate.entryExitFee ?? 0,
      customsFee: rate.customsFee ?? 0,
      currency: rate.currency || "VND",
      validFrom: rate.validFrom || "2026-01-01",
      validTo: rate.validTo || "2026-12-31",
      status: rate.status || "ACTIVE",
      notes: rate.notes || "",
    };
  }

  return {
    borderPairId: "BOY-PHU",
    borderPairName: "Bờ Y – Phu Kua",
    countryPair: "Việt - Lào",
    provinces: "Kon Tum – Attapeu",
    commodityName: "Tất cả loại hàng",
    infrastructureFee: 0,
    entryExitFee: 0,
    customsFee: 0,
    currency: "VND",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "",
  };
}

export function BorderRateFormDialog({
  open,
  onOpenChange,
  rate,
  commodityOptions,
  onSuccess,
}: BorderRateFormDialogProps) {
  if (!open) return null;

  const instanceKey = rate ? rate.rateId : "new";

  return (
    <BorderRateFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      rate={rate}
      commodityOptions={commodityOptions}
      onSuccess={onSuccess}
    />
  );
}

function BorderRateFormDialogContent({
  open,
  onOpenChange,
  rate,
  commodityOptions,
  onSuccess,
}: BorderRateFormDialogProps) {
  const [form, setForm] = useState<SaveBorderRateInput>(() => getInitialForm(rate));
  const isEditing = Boolean(rate);

  const [commodityList, setCommodityList] = useState<string[]>(commodityOptions || []);

  useEffect(() => {
    let isMounted = true;
    getCommoditiesAction().then((res) => {
      if (isMounted && res.success && res.data) {
        setCommodityList(res.data.map((c) => c.name).filter(Boolean));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Kiểm tra xem cặp cửa khẩu có trong danh mục mẫu không
  const isStandardPair = STANDARD_BORDER_PAIRS.some((p) => p.id === form.borderPairId && p.id !== "CUSTOM");
  const [isCustomPair, setIsCustomPair] = useState(!isStandardPair && isEditing);
  const [selectedPreset, setSelectedPreset] = useState(
    isStandardPair ? form.borderPairId : "CUSTOM"
  );

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tính tổng chi phí theo thời gian thực
  const calculatedTotal =
    Number(form.infrastructureFee || 0) +
    Number(form.entryExitFee || 0) +
    Number(form.customsFee || 0);

  // Xử lý khi chọn cặp cửa khẩu từ danh sách mẫu
  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    if (presetId === "CUSTOM") {
      setIsCustomPair(true);
      setForm((prev) => ({
        ...prev,
        borderPairId: "",
        borderPairName: "",
        provinces: "",
      }));
    } else {
      setIsCustomPair(false);
      const matched = STANDARD_BORDER_PAIRS.find((p) => p.id === presetId);
      if (matched) {
        setForm((prev) => ({
          ...prev,
          borderPairId: matched.id,
          borderPairName: matched.name,
          countryPair: matched.countryPair,
          provinces: matched.provinces,
        }));
      }
    }
    // Xóa lỗi nếu có
    setErrors((prev) => {
      const next = { ...prev };
      delete next.borderPairId;
      delete next.borderPairName;
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.borderPairId.trim()) errs.borderPairId = "Vui lòng nhập hoặc chọn mã cặp cửa khẩu.";
    if (!form.borderPairName.trim()) errs.borderPairName = "Vui lòng nhập tên cặp cửa khẩu.";
    if (!form.commodityName.trim()) errs.commodityName = "Vui lòng nhập mặt hàng áp dụng.";
    if (!form.validFrom) errs.validFrom = "Vui lòng nhập ngày bắt đầu hiệu lực.";
    if (!form.validTo) errs.validTo = "Vui lòng nhập ngày kết thúc hiệu lực.";
    if (form.validFrom && form.validTo && form.validFrom > form.validTo) {
      errs.validTo = "Ngày kết thúc phải lớn hơn ngày bắt đầu.";
    }
    if (calculatedTotal <= 0) {
      errs.fees = "Tổng chi phí qua cửa khẩu phải lớn hơn 0 ₫.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin bắt buộc.");
      return;
    }

    setSaving(true);
    try {
      const res = await saveBorderRateAction(form);
      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Không thể lưu biểu phí cửa khẩu.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi hệ thống khi lưu biểu phí.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>
            {isEditing ? "Cập Nhật Biểu Phí Cửa Khẩu" : "Thêm Mới Biểu Phí Cửa Khẩu & Bãi Kiểm Hóa"}
          </span>
        </div>
      }
      description="Biểu phí qua các cặp cửa khẩu liên vận đường bộ Việt - Lào và Việt - Campuchia theo định mức chi phí chuẩn THILOGI."
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
        {/* Nhóm 1: Lựa chọn cặp cửa khẩu & Tuyến liên vận */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <h4 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" /> Thông tin Cặp Cửa Khẩu &amp; Tuyến
          </h4>

          {/* Chọn cửa khẩu mẫu */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Chọn cặp cửa khẩu mẫu:
            </label>
            <select
              aria-label="Chọn cặp cửa khẩu mẫu"
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {STANDARD_BORDER_PAIRS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.provinces ? `(${p.provinces})` : ""} - [{p.countryPair}]
                </option>
              ))}
            </select>
          </div>

          {/* Nếu chọn Tùy chọn (Custom) hoặc cần chỉnh sửa chi tiết */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {/* Mã cặp cửa khẩu */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mã cặp cửa khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.borderPairId}
                disabled={!isCustomPair && !isEditing}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, borderPairId: e.target.value.toUpperCase() }));
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.borderPairId;
                    return next;
                  });
                }}
                placeholder="VD: BOY-PHU, LAB-DAN..."
                className={`w-full bg-background border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.borderPairId ? "border-red-500" : "border-border"
                  }`}
              />
              {errors.borderPairId && (
                <span className="text-[11px] text-red-500 mt-0.5 block">{errors.borderPairId}</span>
              )}
            </div>

            {/* Tên cặp cửa khẩu */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tên cặp cửa khẩu liên vận <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.borderPairName}
                disabled={!isCustomPair && !isEditing}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, borderPairName: e.target.value }));
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.borderPairName;
                    return next;
                  });
                }}
                placeholder="VD: Bờ Y – Phu Kua..."
                className={`w-full bg-background border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.borderPairName ? "border-red-500" : "border-border"
                  }`}
              />
              {errors.borderPairName && (
                <span className="text-[11px] text-red-500 mt-0.5 block">{errors.borderPairName}</span>
              )}
            </div>

            {/* Tuyến Quốc gia */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tuyến Quốc gia <span className="text-red-500">*</span>
              </label>
              <select
                aria-label="Chọn tuyến quốc gia"
                value={form.countryPair}
                onChange={(e) => setForm((prev) => ({ ...prev, countryPair: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Việt - Lào">Việt - Lào (LAO)</option>
                <option value="Việt - CPC">Việt - Campuchia (CPC)</option>
              </select>
            </div>

            {/* Cặp tỉnh thành */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Cặp tỉnh thành giáp biên
              </label>
              <input
                type="text"
                value={form.provinces}
                onChange={(e) => setForm((prev) => ({ ...prev, provinces: e.target.value }))}
                placeholder="VD: Kon Tum – Attapeu, Quảng Trị – Savannakhet..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Nhóm 2: Mặt hàng áp dụng */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <h4 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Mặt Hàng &amp; Bóc Tách Các Loại Chi Phí
          </h4>

          {/* Mặt hàng */}
          <div>
            <label htmlFor="border-commodity-select" className="block text-xs font-semibold text-foreground mb-1">
              Mặt hàng quy định áp dụng <span className="text-red-500">*</span>
            </label>
            <select
              id="border-commodity-select"
              value={form.commodityName || ""}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({ ...prev, commodityName: val }));
                if (errors.commodityName) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.commodityName;
                    return next;
                  });
                }
              }}
              className={`w-full bg-background border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.commodityName ? "border-red-500" : "border-border"
                }`}
            >
              <option value="">-- Chọn mặt hàng từ Danh mục Hàng hóa --</option>
              <option value="Tất cả loại hàng">Tất cả loại hàng (Định mức chung)</option>
              {form.commodityName &&
                form.commodityName !== "Tất cả loại hàng" &&
                !commodityList.includes(form.commodityName) && (
                  <option value={form.commodityName}>
                    {form.commodityName} (Hiện tại)
                  </option>
                )}
              {commodityList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.commodityName && (
              <span className="text-[11px] text-red-500 mt-0.5 block">{errors.commodityName}</span>
            )}
          </div>

          {/* 3 loại phí: Phí CSHT, Phí vào bãi, Phí tờ khai */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Phí CSHT */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                1. Phí hạ tầng (CSHT)
              </label>
              <CurrencyInput
                value={form.infrastructureFee}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, infrastructureFee: val ?? 0 }));
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.fees;
                    return next;
                  });
                }}
                className="w-full text-right font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Phí sử dụng đường/hạ tầng
              </span>
            </div>

            {/* Phí Vào Bãi */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                2. Phí ra vào bãi kiểm hóa
              </label>
              <CurrencyInput
                value={form.entryExitFee}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, entryExitFee: val ?? 0 }));
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.fees;
                    return next;
                  });
                }}
                className="w-full text-right font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Vé cân xe &amp; kiểm hóa bãi
              </span>
            </div>

            {/* Phí Tờ Khai */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                3. Lệ phí tờ khai hải quan
              </label>
              <CurrencyInput
                value={form.customsFee}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, customsFee: val ?? 0 }));
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.fees;
                    return next;
                  });
                }}
                className="w-full text-right font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Thủ tục thông quan biên giới
              </span>
            </div>
          </div>

          {/* Hộp xem trước Tổng chi phí */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                  Tổng chi phí định mức qua cửa khẩu:
                </span>
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                  (CSHT + Bãi kiểm hóa + Tờ khai HQ)
                </span>
              </div>
            </div>
            <div className="font-mono text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(calculatedTotal, form.currency)}
            </div>
          </div>
          {errors.fees && (
            <span className="text-[11px] text-red-500 block">{errors.fees}</span>
          )}
        </div>

        {/* Nhóm 3: Thời hạn hiệu lực & Ghi chú */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Hiệu lực từ ngày */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Hiệu lực từ ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.validFrom && (
                <span className="text-[11px] text-red-500 mt-0.5 block">{errors.validFrom}</span>
              )}
            </div>

            {/* Hiệu lực đến ngày */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Hiệu lực đến ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.validTo}
                onChange={(e) => setForm((prev) => ({ ...prev, validTo: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.validTo && (
                <span className="text-[11px] text-red-500 mt-0.5 block">{errors.validTo}</span>
              )}
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Trạng thái áp dụng
              </label>
              <select
                aria-label="Chọn trạng thái áp dụng"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="ACTIVE">Đang áp dụng (ACTIVE)</option>
                <option value="INACTIVE">Hết hiệu lực (INACTIVE)</option>
              </select>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Ghi chú nghiệp vụ / Quy định cửa khẩu
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="VD: Cửa khẩu Bờ Y phục vụ xuất nhập khẩu chuối từ nông trường Attapeu..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Nút tác vụ chân form */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={saving}
            className="font-semibold"
          >
            {isEditing ? "Lưu thay đổi" : "Tạo biểu phí mới"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}

