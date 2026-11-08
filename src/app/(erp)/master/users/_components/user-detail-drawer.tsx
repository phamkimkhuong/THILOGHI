"use client";

import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { Button } from "@/components/ui/button";
import {
  Shield,
  MapPin,
  Building2,
  Mail,
  Calendar,
  Clock,
  KeyRound,
  Lock,
  Unlock,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import {
  type UserItem,
  getRoleBadge,
  getRegionScopeBadge,
  ROLES_LIST,
} from "./types";

interface UserDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  user: UserItem | null;
  onEdit: (user: UserItem) => void;
  onResetPassword: (user: UserItem) => void;
  onToggleLock: (user: UserItem) => void;
}

export function UserDetailDrawer({
  open,
  onClose,
  user,
  onEdit,
  onResetPassword,
  onToggleLock,
}: UserDetailDrawerProps) {
  if (!user) return null;

  const roleBadge = getRoleBadge(user.role);
  const roleConfig = ROLES_LIST.find((r) => r.id === user.role);

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((n) => n[0]?.toUpperCase())
        .join("")
    : user.username.slice(0, 2).toUpperCase();

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <ResponsiveDrawer
      open={open}
      onClose={onClose}
      title="Hồ sơ cán bộ nhân viên"
      subtitle={`Mã định danh: ${user.userId}`}
    >
      <div className="space-y-5 text-xs font-sans">
        {/* Card Header Avatar */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#102f63] text-white flex items-center justify-center text-lg font-bold shadow-md shadow-[#102f63]/25 shrink-0 border-2 border-white dark:border-slate-800">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">
              {user.fullName}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${roleBadge.className}`}
              >
                {roleBadge.label}
              </span>
              {user.isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang hoạt động
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Đang tạm khóa
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Khối 1: Thông tin liên hệ & Đơn vị */}
        <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Đơn vị công tác & Liên hệ</span>
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground text-[11px]">Đơn vị / Công ty:</p>
              <p className="font-medium text-foreground mt-0.5">
                {user.company || "THILOGI Chu Lai"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[11px]">Phòng ban:</p>
              <p className="font-medium text-foreground mt-0.5">
                {user.department || "Khối Vận hành"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Email công vụ:</span>
              </p>
              <p className="font-mono text-foreground mt-0.5">{user.email || "—"}</p>
            </div>
          </div>
        </div>

        {/* Khối 2: Vai trò & Thẩm quyền */}
        <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Thẩm quyền vai trò trong ERP</span>
          </h4>

          {roleConfig && (
            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{roleConfig.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {roleConfig.description}
              </p>
            </div>
          )}
        </div>

        {/* Khối 3: Phạm vi phân vùng Logistics */}
        <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Phạm vi phân vùng được giao (Region Scopes)</span>
          </h4>

          <div className="space-y-2">
            {user.regionScopes && user.regionScopes.length > 0 ? (
              user.regionScopes.map((scope) => {
                const badge = getRegionScopeBadge(scope);
                return (
                  <div
                    key={scope}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-hover/70 border border-border text-xs"
                  >
                    <span className="font-medium text-foreground">{badge.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground bg-surface px-2 py-0.5 rounded border border-border">
                      {scope}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground italic">Chưa được gán phân vùng</p>
            )}
          </div>
        </div>

        {/* Khối 4: Nhật ký thời gian */}
        <div className="p-4 rounded-xl border border-border bg-surface space-y-2.5">
          <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Nhật ký thời gian</span>
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Ngày khởi tạo:</span>
              </p>
              <p className="font-mono text-foreground mt-0.5">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Cập nhật gần nhất:</span>
              </p>
              <p className="font-mono text-foreground mt-0.5">
                {formatDate(user.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Khối Actions cuối */}
        <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center gap-2">
          <Button
            type="button"
            className="w-full sm:flex-1"
            onClick={() => {
              onClose();
              onEdit(user);
            }}
          >
            <Edit2 className="w-4 h-4 mr-1.5" /> Chỉnh sửa hồ sơ
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:flex-1"
            onClick={() => {
              onClose();
              onResetPassword(user);
            }}
          >
            <KeyRound className="w-4 h-4 mr-1.5" /> Đổi mật khẩu
          </Button>

          <Button
            type="button"
            variant={user.isActive ? "destructive" : "outline"}
            className="w-full sm:w-auto"
            onClick={() => {
              onClose();
              onToggleLock(user);
            }}
          >
            {user.isActive ? (
              <>
                <Lock className="w-4 h-4 mr-1.5" /> Khóa
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-1.5" /> Mở khóa
              </>
            )}
          </Button>
        </div>
      </div>
    </ResponsiveDrawer>
  );
}
