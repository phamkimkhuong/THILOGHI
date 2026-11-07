"use client";

import { useState } from "react";
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  ShieldCheck,
  Ban,
  History,
  SlidersHorizontal,
  CheckCircle2,
  RefreshCw,
  Pencil,
  FileText,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  PARTNER_TYPE_BADGES,
  PAYMENT_TERMS_OPTIONS,
  type PartnerDirectoryItem,
  type CustomerRecord,
  type VendorRecord,
  type PartnerRoleAuditItem,
} from "./types";
import {
  activateCustomerRoleAction,
  suspendCustomerRoleAction,
  requestCustomerRoleActivationAction,
  updateCustomerRoleTermsAction,
} from "@/features/master-data/actions";

interface PartnerDetailDrawerProps {
  partner: PartnerDirectoryItem | CustomerRecord | VendorRecord | null;
  onClose: () => void;
  onEdit: (partner: PartnerDirectoryItem) => void;
  auditLogs: PartnerRoleAuditItem[];
  isLoadingAudit: boolean;
  auditError: string | null;
  onRefreshAudit: (partnerId: string) => void;
  onSuccessRefresh: () => void;
}

export function PartnerDetailDrawer({
  partner,
  onClose,
  onEdit,
  auditLogs,
  isLoadingAudit,
  auditError,
  onRefreshAudit,
  onSuccessRefresh,
}: PartnerDetailDrawerProps) {
  const [drawerTab, setDrawerTab] = useState<"INFO" | "LIFECYCLE" | "AUDIT">("INFO");

  // Lifecycle form states
  const [termsDaysInput, setTermsDaysInput] = useState<number>(30);
  const [creditLimitInput, setCreditLimitInput] = useState<string>("");
  const [suspendReasonInput, setSuspendReasonInput] = useState("");
  const [activationCommentInput, setActivationCommentInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [prevPartnerId, setPrevPartnerId] = useState<string | null>(null);

  // Normalize partner attributes
  const partnerId =
    (partner as PartnerDirectoryItem)?.partnerId ||
    (partner as CustomerRecord)?.customerId ||
    (partner as VendorRecord)?.vendorId ||
    "";

  const partnerName =
    (partner as PartnerDirectoryItem)?.partnerName ||
    (partner as CustomerRecord)?.customerName ||
    (partner as VendorRecord)?.vendorName ||
    "";

  const shortName = (partner as PartnerDirectoryItem)?.shortName || (partner as CustomerRecord)?.shortName;
  const taxCode = (partner as PartnerDirectoryItem)?.taxCode || (partner as CustomerRecord)?.taxCode || (partner as VendorRecord)?.taxCode;
  const address = (partner as PartnerDirectoryItem)?.address || (partner as CustomerRecord)?.address;
  const phone = (partner as PartnerDirectoryItem)?.phone || (partner as CustomerRecord)?.phone || (partner as VendorRecord)?.phone;
  const email = (partner as PartnerDirectoryItem)?.email || (partner as CustomerRecord)?.email || (partner as VendorRecord)?.email;
  const representedBy = (partner as PartnerDirectoryItem)?.representedBy;
  const gpsCoordinates = (partner as PartnerDirectoryItem)?.gpsCoordinates;
  const bankAccount = (partner as PartnerDirectoryItem)?.bankAccount;
  const bankName = (partner as PartnerDirectoryItem)?.bankName;
  const note = (partner as PartnerDirectoryItem)?.note;
  const country = (partner as PartnerDirectoryItem)?.country || "Việt Nam";
  const sourcePartnerType = (partner as PartnerDirectoryItem)?.sourcePartnerType || "Đối tác";

  const roleStatus =
    (partner as PartnerDirectoryItem)?.customerRoleStatus ||
    (partner as CustomerRecord)?.status ||
    (partner as VendorRecord)?.status ||
    "NONE";

  const paymentTermsDays =
    (partner as PartnerDirectoryItem)?.paymentTermsDays ??
    (partner as CustomerRecord)?.paymentTermsDays ??
    30;

  const creditLimitVnd =
    (partner as PartnerDirectoryItem)?.creditLimitVnd ??
    (partner as CustomerRecord)?.creditLimit ??
    null;

  // React 19 state synchronization
  if (partner && partnerId !== prevPartnerId) {
    setPrevPartnerId(partnerId);
    setTermsDaysInput(paymentTermsDays);
    setCreditLimitInput(creditLimitVnd == null ? "" : String(creditLimitVnd));
    setSuspendReasonInput("");
    setActivationCommentInput("");
    setDrawerTab("INFO");
  }

  if (!partner) return null;

  const typeBadge = PARTNER_TYPE_BADGES[sourcePartnerType] || {
    label: sourcePartnerType,
    badgeClass: "bg-surface text-muted-foreground border-border",
  };

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  // Handlers
  const handleActivateRole = async () => {
    setActionLoading(true);
    try {
      const trimmed = creditLimitInput.trim();
      const parsedLimit = trimmed === "" ? null : Math.max(0, Number(trimmed));
      const res = await activateCustomerRoleAction({
        partnerId,
        paymentTermsDays: Number(termsDaysInput),
        creditLimitVnd: parsedLimit,
        comment: activationCommentInput.trim() || undefined,
      });
      if (!res.success) throw new Error(res.error || "Không thể kích hoạt vai trò.");
      toast.success(res.message || "Đã kích hoạt vai trò Khách hàng thành công!");
      onSuccessRefresh();
      onRefreshAudit(partnerId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi kích hoạt vai trò");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendRole = async () => {
    if (!suspendReasonInput.trim() || suspendReasonInput.trim().length < 3) {
      toast.error("Vui lòng nhập lý do tạm ngừng tối thiểu 3 ký tự.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await suspendCustomerRoleAction({
        partnerId,
        reason: suspendReasonInput.trim(),
      });
      if (!res.success) throw new Error(res.error || "Không thể tạm ngừng vai trò.");
      toast.success(res.message || "Đã tạm ngừng vai trò Khách hàng.");
      onSuccessRefresh();
      onRefreshAudit(partnerId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi tạm ngừng vai trò");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestActivation = async () => {
    setActionLoading(true);
    try {
      const res = await requestCustomerRoleActivationAction(partnerId);
      if (!res.success) throw new Error(res.error || "Không thể gửi đề nghị.");
      toast.success(res.message || "Đã gửi đề nghị kích hoạt vai trò!");
      onSuccessRefresh();
      onRefreshAudit(partnerId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi gửi đề nghị");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTerms = async () => {
    setActionLoading(true);
    try {
      const trimmed = creditLimitInput.trim();
      const parsedLimit = trimmed === "" ? null : Math.max(0, Number(trimmed));
      const res = await updateCustomerRoleTermsAction({
        partnerId,
        paymentTermsDays: Number(termsDaysInput),
        creditLimitVnd: parsedLimit,
      });
      if (!res.success) throw new Error(res.error || "Không thể cập nhật hạn mức.");
      toast.success(res.message || "Đã cập nhật điều khoản và hạn mức tín dụng!");
      onSuccessRefresh();
      onRefreshAudit(partnerId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi cập nhật");
    } finally {
      setActionLoading(false);
    }
  };

  const isDirectoryItem = "partnerName" in partner;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end font-sans animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-surface border-l border-border shadow-2xl h-full flex flex-col justify-between transform transition-transform animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-drawer-title"
      >
        {/* Header Drawer */}
        <div className="p-4 border-b border-border flex items-start justify-between bg-surface-hover">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 border border-blue-200 dark:border-blue-800">
                <Building2 className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {partnerId}
              </span>
              <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${typeBadge.badgeClass}`}>
                {typeBadge.label}
              </span>
              <StatusBadge status={roleStatus} />
            </div>
            <h2 id="partner-drawer-title" className="text-base font-bold text-foreground leading-snug">
              {partnerName}
            </h2>
            {shortName && (
              <p className="text-xs text-muted-foreground font-normal">
                Tên viết tắt: <strong className="text-foreground">{shortName}</strong>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-tabs điều hướng trong Drawer */}
        <div className="px-4 pt-3 border-b border-border bg-background">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface border border-border text-xs">
            <button
              type="button"
              onClick={() => setDrawerTab("INFO")}
              className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors cursor-pointer ${
                drawerTab === "INFO"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              Hồ Sơ Pháp Nhân
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab("LIFECYCLE")}
              className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors cursor-pointer ${
                drawerTab === "LIFECYCLE"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              Vòng Đời Role & Tín Dụng
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerTab("AUDIT");
                onRefreshAudit(partnerId);
              }}
              className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors cursor-pointer ${
                drawerTab === "AUDIT"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              Lịch Sử Audit ({auditLogs.length})
            </button>
          </div>
        </div>

        {/* Nội dung chi tiết Drawer */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-foreground">
          {/* ================= TAB 1: INFO ================= */}
          {drawerTab === "INFO" && (
            <div className="space-y-3.5">
              {/* Thông tin định danh */}
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Tên pháp nhân đầy đủ:</span>
                  <strong className="text-sm text-foreground block mt-0.5">{partnerName}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Mã số thuế:</span>
                    <span className="text-foreground font-mono font-bold text-xs">{taxCode || "Chưa cập nhật"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Quốc gia:</span>
                    <span className="text-foreground font-semibold text-xs">{country}</span>
                  </div>
                </div>
              </div>

              {/* Thông tin liên hệ & địa chỉ */}
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
                <div className="flex items-start gap-2 text-foreground">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="leading-relaxed block">{address || "Chưa cập nhật địa chỉ trụ sở"}</span>
                    {gpsCoordinates && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gpsCoordinates)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        GPS: {gpsCoordinates} ↗
                      </a>
                    )}
                  </div>
                </div>
                {representedBy && (
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      Người đại diện: <strong className="font-semibold">{representedBy}</strong>
                    </span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <a href={`tel:${phone}`} className="font-mono font-medium hover:underline">
                      {phone}
                    </a>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                    <a href={`mailto:${email}`} className="hover:underline">
                      {email}
                    </a>
                  </div>
                )}
                {(bankAccount || bankName) && (
                  <div className="flex items-center gap-2 text-foreground pt-1 border-t border-border/60">
                    <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-[11px] font-mono">
                      Ngân hàng: <strong>{bankAccount || "-"}</strong> ({bankName || "-"})
                    </span>
                  </div>
                )}
                {note && (
                  <div className="flex items-start gap-2 text-foreground pt-1 border-t border-border/60">
                    <FileText className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-muted-foreground italic">{note}</span>
                  </div>
                )}
              </div>

              {/* Điều khoản thương mại */}
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-sans flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Hạn nợ thương mại:
                  </span>
                  <strong className="text-foreground text-xs">{termsDaysInput} ngày</strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="text-muted-foreground font-sans flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Hạn mức tín dụng:
                  </span>
                  {creditLimitInput.trim() === "" ? (
                    <span className="text-muted-foreground italic text-xs font-sans">Chưa thiết lập</span>
                  ) : Number(creditLimitInput) === 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium text-xs font-sans">
                      0 ₫ (Bắt buộc trả trước)
                    </span>
                  ) : (
                    <strong className="text-emerald-600 dark:text-emerald-400 text-xs">
                      {formatVND(Number(creditLimitInput))}
                    </strong>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: LIFECYCLE MANAGEMENT ================= */}
          {drawerTab === "LIFECYCLE" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40 space-y-1.5">
                <h4 className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4" /> Nguyên Tắc Quản Trị Rủi Ro (Risk Enforcement)
                </h4>
                <p className="text-foreground leading-relaxed text-[11px]">
                  Một Đối tác chỉ được phép giao dịch thương mại khi Customer Role ở trạng thái{" "}
                  <strong>ACTIVE</strong>. Nếu đối tác chưa được kích hoạt hoặc đang bị tạm ngừng, hệ thống sẽ tự động tạm khóa quyền giao dịch để kiểm soát rủi ro công nợ (Fail-Closed).
                </p>
              </div>

              {/* Điều chỉnh Hạn nợ & Tín dụng */}
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-3">
                <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  Cấu Hình Điều Khoản & Hạn Mức Tín Dụng
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Hạn nợ thương mại:
                    </label>
                    <select
                      value={termsDaysInput}
                      onChange={(e) => setTermsDaysInput(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
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
                      Hạn mức tín dụng (VND):
                    </label>
                    <CurrencyInput
                      value={creditLimitInput === "" ? undefined : Number(creditLimitInput)}
                      onValueChange={(val) => setCreditLimitInput(val !== undefined ? String(val) : "")}
                      placeholder="0: trả trước"
                      className="w-full text-xs font-mono"
                    />
                  </div>
                </div>

                {roleStatus === "ACTIVE" && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading}
                    onClick={handleUpdateTerms}
                    className="w-full text-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Cập nhật Điều khoản & Hạn mức
                  </Button>
                )}
              </div>

              {/* Kích hoạt / Tạm ngừng */}
              {roleStatus !== "ACTIVE" ? (
                <div className="p-3.5 rounded-xl bg-background border border-border space-y-3">
                  <h4 className="font-bold text-emerald-600 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Kích Hoạt Vai Trò Khách Hàng (Customer Role: ACTIVE)
                  </h4>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Ghi chú phê duyệt kích hoạt (tùy chọn):
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Đã thẩm định hồ sơ năng lực thanh toán..."
                      value={activationCommentInput}
                      onChange={(e) => setActivationCommentInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionLoading}
                      onClick={handleActivateRole}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Kích Hoạt Ngay (Active)
                    </Button>
                    {roleStatus === "NONE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={handleRequestActivation}
                        className="text-xs"
                      >
                        Đề nghị xét duyệt (Pending)
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-background border border-rose-200 dark:border-rose-900/40 space-y-3">
                  <h4 className="font-bold text-rose-600 flex items-center gap-1.5 text-xs">
                    <Ban className="w-3.5 h-3.5" />
                    Tạm Ngừng Vai Trò Khách Hàng (Suspend Role)
                  </h4>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Lý do tạm ngừng (bắt buộc kiểm toán):
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Quá hạn công nợ 60 ngày, đang giải quyết tranh chấp..."
                      value={suspendReasonInput}
                      onChange={(e) => setSuspendReasonInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-xs"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    loading={actionLoading}
                    onClick={handleSuspendRole}
                    className="text-xs"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" /> Xác Nhận Tạm Ngừng Vai Trò
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: AUDIT TRAIL ================= */}
          {drawerTab === "AUDIT" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <History className="w-4 h-4 text-muted-foreground" />
                  Lịch Sử Thay Đổi Trạng Thái Vai Trò
                </span>
                <button
                  type="button"
                  onClick={() => onRefreshAudit(partnerId)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingAudit ? "animate-spin" : ""}`} />
                  Làm mới
                </button>
              </div>

              {isLoadingAudit ? (
                <p className="py-8 text-center text-muted-foreground">Đang tải lịch sử audit...</p>
              ) : auditError ? (
                <div className="py-8 text-center text-red-500">Không tải được lịch sử thay đổi.</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground bg-background rounded-xl border border-border">
                  Chưa có lịch sử thay đổi nào cho đối tác này.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.logId}
                      className="p-3 rounded-xl bg-background border border-border space-y-1 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">
                          {log.action === "ACTIVATE" && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px]">
                              KÍCH HOẠT (ACTIVATE)
                            </span>
                          )}
                          {log.action === "SUSPEND" && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 text-[10px]">
                              TẠM NGỪNG (SUSPEND)
                            </span>
                          )}
                          {log.action === "REQUEST_ACTIVATION" && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[10px]">
                              ĐỀ NGHỊ (REQUEST)
                            </span>
                          )}
                          {log.action === "UPDATE_TERMS" && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px]">
                              ĐỔI HẠN MỨC (UPDATE)
                            </span>
                          )}
                          {log.action === "CREATE_PARTNER" && (
                            <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px]">
                              TẠO MỚI ĐỐI TÁC
                            </span>
                          )}
                          {log.action === "UPDATE_PARTNER" && (
                            <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px]">
                              CẬP NHẬT HỒ SƠ
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="text-muted-foreground font-sans text-[11px]">
                        Thực hiện bởi: <strong className="text-foreground">{log.actorName || log.actorId}</strong>
                      </div>
                      {log.details && (
                        <div className="text-muted-foreground text-[10px] bg-surface p-1.5 rounded-lg border border-border mt-1 overflow-x-auto">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Drawer */}
        <div className="p-4 border-t border-border bg-surface-hover flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDirectoryItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(partner as PartnerDirectoryItem);
                }}
                className="text-xs"
              >
                <Pencil className="w-3.5 h-3.5 mr-1 text-amber-600" /> Sửa thông tin
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
