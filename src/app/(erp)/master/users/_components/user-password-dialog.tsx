"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import type { UserItem } from "./types";
import { resetUserPasswordAction } from "@/features/master-data/user-actions";

interface UserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserItem | null;
  onSuccess: () => void;
}

export function UserPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetUserPasswordAction(user.userId, newPassword.trim());
      if (!res.success) {
        throw new Error(res.error);
      }
      toast.success(res.message);
      onOpenChange(false);
      setNewPassword("");
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
      title="Đặt lại mật khẩu nhân sự"
      description={`Cập nhật mật khẩu mới cho tài khoản cán bộ [${user.fullName}]`}
      icon={KeyRound}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        <div className="p-3 bg-surface-hover/60 rounded-xl border border-border">
          <p className="text-muted-foreground text-[11px] mb-1">Tài khoản thao tác:</p>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">{user.fullName}</span>
            <span className="font-mono text-xs text-muted-foreground">(@{user.username})</span>
          </div>
        </div>

        <div>
          <label className="block font-medium text-foreground mb-1">
            Mật khẩu mới <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập tối thiểu 6 ký tự..."
              className="w-full h-9 pl-3 pr-9 rounded-lg border border-border bg-surface text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Mật khẩu mới sẽ có hiệu lực ngay lập tức khi đăng nhập.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
