"use client";

import { useState } from "react";
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
  const note = partner.note;
  const country = partner.country || "Việt Nam";
  const sourcePartnerType = partner.sourcePartnerType || "Đối tác";
  const status = partner.status || "ACTIVE";

  // Lọc dữ liệu placeholder cũ từ AppSheet
  const isPlaceholder = (val?: string) => {
    if (!val) return true;
    const v = val.trim().toLowerCase();
    return v === "" || v === "update" || v === "wait" || v === "null" || v === "undefined" || v === "0" || v === "-";
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

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-lg bg-surface border-l border-border shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
          {/* Header Drawer */}
          <div className="p-4 border-b border-border bg-surface-hover flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
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
              <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2">
                {partnerName}
              </h3>
              {shortName && (
                <p className="text-xs text-muted-foreground font-normal">
                  Tên viết tắt: <strong className="text-foreground">{shortName}</strong>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer shrink-0"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nội dung chi tiết Hồ Sơ Đối Tác */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-foreground">
            {/* Khối 1: Thông tin pháp nhân */}
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Thông Tin Pháp Nhân
              </h4>
              <div className="space-y-1.5 pt-1">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Tên pháp nhân đầy đủ:</span>
                  <strong className="text-sm text-foreground block mt-0.5">{partnerName}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Mã số thuế (MST):</span>
                    {cleanTax ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-foreground font-mono font-bold text-xs">{cleanTax}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(cleanTax, "mã số thuế")}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Sao chép MST"
                        >
                          {copiedField === "mã số thuế" ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Chưa cập nhật / Quốc tế</span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground block">Quốc gia & Lãnh thổ:</span>
                    <span className="text-foreground font-semibold text-xs flex items-center gap-1 mt-0.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>{countryBadge.name}</span>
                    </span>
                  </div>
                </div>

                {cleanRep && (
                  <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-foreground">
                    <User className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      Người đại diện pháp luật: <strong className="font-semibold">{cleanRep}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Khối 2: Địa chỉ & Điều vận */}
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Địa Chỉ & Kho Bãi Điều Vận
              </h4>
              <div className="space-y-2.5 pt-1">
                <div className="flex items-start justify-between gap-2 text-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {address || "Chưa cập nhật địa chỉ trụ sở / kho bãi"}
                    </span>
                  </div>
                  {address && (
                    <button
                      type="button"
                      onClick={() => handleCopy(address, "địa chỉ")}
                      className="px-2 py-1 rounded bg-surface border border-border text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      title="Sao chép địa chỉ"
                    >
                      {copiedField === "địa chỉ" ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  )}
                </div>

                {gpsCoordinates && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px] font-mono">
                      GPS: {gpsCoordinates}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        gpsCoordinates
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-[11px] font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" /> Mở Google Maps vệ tinh ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Khối 3: Thông tin liên hệ */}
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-600" /> Đầu Mối Liên Hệ
              </h4>
              <div className="space-y-2 pt-1">
                {cleanPhone ? (
                  <div className="flex items-center justify-between text-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono font-medium">{cleanPhone}</span>
                    </div>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Bấm để gọi
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    <span className="italic">Chưa có số điện thoại</span>
                  </div>
                )}

                {cleanEmail ? (
                  <div className="flex items-center justify-between text-foreground pt-1 border-t border-border/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="truncate">{cleanEmail}</span>
                    </div>
                    <a
                      href={`mailto:${cleanEmail}`}
                      className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
                    >
                      Gửi email
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground pt-1 border-t border-border/60">
                    <Mail className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    <span className="italic">Chưa có email liên hệ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Khối 4: Tài khoản ngân hàng (nếu có) */}
            {(bankAccount || bankName) && (
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Tài Khoản Thanh Toán
                </h4>
                <div className="text-foreground pt-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Số tài khoản:</span>
                    <strong className="font-mono text-foreground">{bankAccount || "-"}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Ngân hàng:</span>
                    <span className="text-foreground font-medium">{bankName || "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Khối 5: Ghi chú nội bộ (nếu có) */}
            {note && (
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-1.5">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-stone-500" /> Ghi Chú Nghiệp Vụ
                </h4>
                <p className="text-foreground leading-relaxed italic text-xs pt-0.5">{note}</p>
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
