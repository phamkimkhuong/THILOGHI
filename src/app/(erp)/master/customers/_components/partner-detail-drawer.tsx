"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Pencil,
  FileText,
  User,
  Building2,
  Globe,
  CreditCard,
  Copy,
  Check,
  Calendar,
  Briefcase,
  Compass,
  Navigation,
  Layers,
  ExternalLink,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  PARTNER_TYPE_BADGES,
  getCountryBadge,
  type PartnerDirectoryItem,
} from "./types";

interface PartnerDetailDrawerProps {
  partner: PartnerDirectoryItem | null;
  onClose: () => void;
  onEdit: (partner: PartnerDirectoryItem) => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function PartnerDetailDrawer({
  partner,
  onClose,
  onEdit,
}: PartnerDetailDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!partner) return null;

  const partnerId = partner.partnerId;
  const partnerName = partner.partnerName;
  const shortName = partner.shortName;
  const rawTaxCode = partner.taxCode;
  const address = partner.address;
  const rawPhone = partner.phone;
  const rawEmail = partner.email;
  const rawRep = partner.representedBy;
  const gpsCoordinates = partner.gpsCoordinates;
  const bankAccount = partner.bankAccount;
  const bankName = partner.bankName;
  const description = partner.description;
  const regionName = partner.regionName;
  const regionId = partner.regionId;
  const note = partner.note;
  const country = partner.country || "Việt Nam";
  const sourcePartnerType = partner.sourcePartnerType || "Đối tác";
  const status = partner.status || "ACTIVE";
  const createdAt = partner.createdAt;

  // Lọc dữ liệu placeholder cũ từ AppSheet ("Update", "Wait", "0", "-")
  const isPlaceholder = (val?: string) => {
    if (!val) return true;
    const v = val.trim().toLowerCase();
    return (
      v === "" ||
      v === "update" ||
      v === "wait" ||
      v === "null" ||
      v === "undefined" ||
      v === "0" ||
      v === "-"
    );
  };

  const cleanTax = isPlaceholder(rawTaxCode) ? null : rawTaxCode;
  const cleanPhone = isPlaceholder(rawPhone) ? null : rawPhone;
  const cleanEmail = isPlaceholder(rawEmail) ? null : rawEmail;
  const cleanRep = isPlaceholder(rawRep) ? null : rawRep;

  const typeBadge = PARTNER_TYPE_BADGES[sourcePartnerType] || {
    label: sourcePartnerType,
    badgeClass: "bg-surface text-muted-foreground border-border",
  };
  const countryBadge = getCountryBadge(country);

  const handleCopy = (text: string, fieldName: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Xác định đối tác có liên quan đến biểu cước mua (Vendor, Line, Supplier, Port, Depot)
  const isRateRelated =
    partner.isVendor ||
    ["Vendors", "Line", "Suppliers", "Port", "Depot"].includes(
      sourcePartnerType
    );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Hồ sơ chi tiết đối tác ${partnerName}`}
      className="fixed inset-0 z-50 overflow-hidden font-sans"
    >
      {/* Lớp nền mờ click-to-close */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside className="w-screen max-w-lg bg-surface border-l border-border shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
          {/* Header Drawer */}
          <div className="p-4 border-b border-border bg-surface-hover flex items-start justify-between gap-3 shrink-0">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded bg-surface border border-border">
                  {partnerId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold border ${typeBadge.badgeClass}`}
                >
                  {typeBadge.label}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-surface border border-border text-foreground font-medium">
                  <span>{countryBadge.flag}</span>
                  <span>{countryBadge.name}</span>
                </span>
                <StatusBadge status={status} />
              </div>

              <h2 className="font-bold text-base text-foreground leading-snug line-clamp-2">
                {partnerName}
              </h2>

              {shortName && (
                <p className="text-xs text-muted-foreground font-normal">
                  Tên viết tắt:{" "}
                  <strong className="text-foreground">{shortName}</strong>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer shrink-0"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Thân Drawer: Danh sách các trường dữ liệu liên tục, không tiêu đề rườm rà */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-foreground scrollbar-thin">
            {/* Khung danh sách trường dữ liệu */}
            <div className="bg-background rounded-xl border border-border divide-y divide-border/60 overflow-hidden">
              {/* 1. Mã đối tác (ID) */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <span className="font-mono text-xs text-blue-600 font-bold">#</span>
                  <span>Mã đối tác (ID)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-foreground">
                    {partnerId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(partnerId, "mã đối tác")}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Sao chép mã"
                  >
                    {copiedField === "mã đối tác" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 2. Tên pháp nhân đầy đủ */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36 pt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Tên pháp nhân</span>
                </div>
                <div className="text-xs font-semibold text-foreground leading-relaxed">
                  {partnerName}
                </div>
              </div>

              {/* 3. Tên viết tắt */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Tên viết tắt</span>
                </div>
                <div className="text-xs font-medium text-foreground">
                  {shortName || <span className="text-muted-foreground">-</span>}
                </div>
              </div>

              {/* 4. Mô tả hoạt động */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Mô tả hoạt động</span>
                </div>
                <div className="text-xs">
                  {description ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {description}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Chưa cập nhật mô tả
                    </span>
                  )}
                </div>
              </div>

              {/* 5. Phân nhóm đối tác */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Phân nhóm đối tác</span>
                </div>
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${typeBadge.badgeClass}`}
                  >
                    {typeBadge.label}
                  </span>
                </div>
              </div>

              {/* 6. Phân vùng quản lý */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Phân vùng quản lý</span>
                </div>
                <div className="text-xs font-medium text-foreground">
                  {regionName ? (
                    <span>
                      {regionName}{" "}
                      {regionId && (
                        <span className="font-mono text-muted-foreground text-[11px]">
                          ({regionId})
                        </span>
                      )}
                    </span>
                  ) : regionId ? (
                    <span className="font-mono">{regionId}</span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Chưa phân vùng
                    </span>
                  )}
                </div>
              </div>

              {/* 7. Quốc gia & Lãnh thổ */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Quốc gia</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <span>{countryBadge.flag}</span>
                  <span>{countryBadge.name}</span>
                </div>
              </div>

              {/* 8. Mã số thuế (MST) */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <span className="font-mono text-xs text-slate-500 font-bold">№</span>
                  <span>Mã số thuế (MST)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {cleanTax ? (
                    <>
                      <span className="font-mono font-bold text-foreground">
                        {cleanTax}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(cleanTax, "mã số thuế")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Sao chép MST"
                      >
                        {copiedField === "mã số thuế" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Chưa cập nhật / Doanh nghiệp nước ngoài
                    </span>
                  )}
                </div>
              </div>

              {/* 9. Người đại diện pháp luật */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Người đại diện</span>
                </div>
                <div className="text-xs">
                  {cleanRep ? (
                    <strong className="font-semibold text-foreground">
                      {cleanRep}
                    </strong>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Chưa cập nhật
                    </span>
                  )}
                </div>
              </div>

              {/* 10. Địa chỉ trụ sở / kho bãi */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Địa chỉ</span>
                </div>
                <div className="flex-1 text-xs text-foreground leading-relaxed">
                  {address ? (
                    <div className="flex items-start justify-between gap-2">
                      <span>{address}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(address, "địa chỉ")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                        title="Sao chép địa chỉ"
                      >
                        {copiedField === "địa chỉ" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Chưa cập nhật địa chỉ trụ sở / kho bãi
                    </span>
                  )}
                </div>
              </div>

              {/* 11. Tọa độ vệ tinh GPS */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <Navigation className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>Tọa độ GPS</span>
                </div>
                <div className="text-xs">
                  {gpsCoordinates ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-foreground">
                        {gpsCoordinates}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          gpsCoordinates
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" /> Bản đồ
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Chưa cập nhật tọa độ
                    </span>
                  )}
                </div>
              </div>

              {/* 12. Số điện thoại */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Số điện thoại</span>
                </div>
                <div className="text-xs">
                  {cleanPhone ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground">
                        {cleanPhone}
                      </span>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        Bấm để gọi
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Chưa cập nhật số điện thoại
                    </span>
                  )}
                </div>
              </div>

              {/* 13. Email giao dịch */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Email liên hệ</span>
                </div>
                <div className="text-xs">
                  {cleanEmail ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-foreground truncate max-w-[200px]">
                        {cleanEmail}
                      </span>
                      <a
                        href={`mailto:${cleanEmail}`}
                        className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-medium hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
                      >
                        Gửi email
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Chưa cập nhật email
                    </span>
                  )}
                </div>
              </div>

              {/* 14. Tài khoản thanh toán */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Tài khoản ngân hàng</span>
                </div>
                <div className="text-xs">
                  {bankAccount || bankName ? (
                    <span className="font-mono text-foreground">
                      {bankAccount || "-"}{" "}
                      {bankName && (
                        <span className="font-sans text-muted-foreground">
                          ({bankName})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Chưa cập nhật tài khoản
                    </span>
                  )}
                </div>
              </div>

              {/* 15. Ghi chú nghiệp vụ */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36 pt-0.5">
                  <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>Ghi chú</span>
                </div>
                <div className="text-xs text-foreground leading-relaxed flex-1">
                  {note ? (
                    <p className="italic">{note}</p>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Không có ghi chú
                    </span>
                  )}
                </div>
              </div>

              {/* 16. Ngày tham gia hệ thống */}
              <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Ngày tham gia</span>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {formatDate(createdAt)}
                </div>
              </div>
            </div>

            {/* Điều hướng nhanh sang Biểu Cước Mua nếu đối tác là Vendor, Line, Supplier, Port, Depot */}
            {isRateRelated && (
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground text-xs truncate">
                      Biểu cước mua / Thầu phụ
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Tra cứu giá vận chuyển đường bộ, cước hãng tàu
                    </div>
                  </div>
                </div>
                <Link
                  href={`/rates?search=${encodeURIComponent(
                    shortName || partnerName || partnerId
                  )}`}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700 transition-colors shrink-0 inline-flex items-center gap-1"
                >
                  <span>Tra cứu cước</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Footer Drawer */}
          <div className="p-4 border-t border-border bg-surface-hover flex items-center justify-between gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onEdit(partner);
                onClose();
              }}
              className="flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-600" />
              <span>Chỉnh sửa hồ sơ</span>
            </Button>

            <Button variant="secondary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
