"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import {
  User,
  Shield,
  MapPin,
  Building2,
  Mail,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import {
  type UserItem,
  type SaveUserInput,
  ROLES_LIST,
  REGION_SCOPES_LIST,
  type UserRole,
} from "./types";
import { saveUserAction } from "@/features/master-data/user-actions";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserItem | null;
  onSuccess: () => void;
}

function getInitialForm(user: UserItem | null): SaveUserInput {
  if (user) {
    return {
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      regionScopes: user.regionScopes && user.regionScopes.length > 0 ? user.regionScopes : ["*"],
      email: user.email || "",
      company: user.company || "THILOGI Chu Lai",
      department: user.department || "",
      password: "",
      isActive: user.isActive,
    };
  }

  return {
    username: "",
    fullName: "",
    role: "SALES",
    regionScopes: ["QUANG_NAM_NEIGHBORS"],
    email: "",
    company: "THILOGI Chu Lai",
    department: "",
    password: "",
    isActive: true,
  };
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormDialogProps) {
  if (!open) return null;

  const instanceKey = user ? user.userId : "new";

  return (
    <UserFormDialogContent
      key={instanceKey}
      open={open}
      onOpenChange={onOpenChange}
      user={user}
      onSuccess={onSuccess}
    />
  );
}

function UserFormDialogContent({
  open,
  onOpenChange,
  user,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserItem | null;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(user);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<SaveUserInput>(() => getInitialForm(user));

  const handleToggleRegion = (regionId: string) => {
    setFormData((prev) => {
      let currentScopes = [...prev.regionScopes];

      if (regionId === "*") {
        // Nếu chọn Toàn quyền thì đặt chỉ duy nhất "*"
        return { ...prev, regionScopes: ["*"] };
      }

      // Nếu đang có "*", bỏ "*" ra khi chọn phân vùng cụ thể
      currentScopes = currentScopes.filter((s) => s !== "*");

      if (currentScopes.includes(regionId)) {
        currentScopes = currentScopes.filter((s) => s !== regionId);
        // Nếu bỏ chọn hết thì fallback về "*"
        if (currentScopes.length === 0) currentScopes = ["*"];
      } else {
        currentScopes.push(regionId);
      }

      return { ...prev, regionScopes: currentScopes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.username.trim()) {
        throw new Error("Vui lòng nhập tên đăng nhập.");
      }
      if (!formData.fullName.trim()) {
        throw new Error("Vui lòng nhập họ và tên nhân sự.");
      }
      if (!isEdit && (!formData.password || formData.password.trim().length < 6)) {
        throw new Error("Mật khẩu khởi tạo phải có ít nhất 6 ký tự.");
      }
      if (formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 6) {
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      }

      const res = await saveUserAction(formData);
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

  const selectedRoleConfig = ROLES_LIST.find((r) => r.id === formData.role);

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Chỉnh sửa tài khoản ${user?.fullName}` : "Thêm mới tài khoản cán bộ nhân viên"}
      description="Cấu hình thông tin hồ sơ nhân sự, phân quyền vai trò nghiệp vụ và phạm vi phân vùng logistics"
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {/* Nhóm 1: Thông tin định danh */}
        <div className="bg-surface-hover/50 p-3.5 rounded-xl border border-border space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs border-b border-border/60 pb-2">
            <User className="w-4 h-4 text-primary" />
            <span>Thông tin nhân sự cơ bản</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tên đăng nhập */}
            <div>
              <label className="block font-medium text-foreground mb-1">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    username: e.target.value.toLowerCase().replace(/\s+/g, ""),
                  }))
                }
                placeholder="VD: nam.sales, vu.pricing"
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Dùng để đăng nhập vào THILOGI ERP (chữ thường, không dấu, viết liền).
              </p>
            </div>

            {/* Họ và tên */}
            <div>
              <label className="block font-medium text-foreground mb-1">
                Họ và tên đầy đủ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium text-foreground mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Email công vụ</span>
              </label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="VD: nguyen-van-nam@thilogi.vn"
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block font-medium text-foreground mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                <span>
                  {isEdit ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu khởi tạo"}{" "}
                  {!isEdit && <span className="text-rose-500">*</span>}
                </span>
              </label>
              <input
                type="password"
                required={!isEdit}
                value={formData.password || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={isEdit ? "Nhập nếu muốn đổi mật khẩu..." : "Tối thiểu 6 ký tự..."}
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>
        </div>

        {/* Nhóm 2: Tổ chức & Vai trò */}
        <div className="bg-surface-hover/50 p-3.5 rounded-xl border border-border space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs border-b border-border/60 pb-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>Tổ chức & Phân quyền chức năng</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Đơn vị công tác */}
            <div>
              <label className="block font-medium text-foreground mb-1">
                Đơn vị / Công ty thành viên
              </label>
              <input
                type="text"
                value={formData.company || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder="VD: THILOGI Chu Lai, Vận tải Đường bộ..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Phòng ban */}
            <div>
              <label className="block font-medium text-foreground mb-1">
                Phòng ban / Bộ phận
              </label>
              <input
                type="text"
                value={formData.department || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, department: e.target.value }))
                }
                placeholder="VD: Ban CNTT, Phòng Định giá, P. Kinh doanh..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Vai trò */}
            <div className="sm:col-span-2">
              <label className="block font-medium text-foreground mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Vai trò hệ thống (Quyền hạn ERP)</span> <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value as UserRole }))
                }
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                {ROLES_LIST.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label} ({role.department})
                  </option>
                ))}
              </select>
              {selectedRoleConfig && (
                <div className="mt-2 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                    <strong>Đặc quyền vai trò:</strong> {selectedRoleConfig.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nhóm 3: Phân vùng phụ trách */}
        <div className="bg-surface-hover/50 p-3.5 rounded-xl border border-border space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs border-b border-border/60 pb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Phạm vi phân vùng Logistics phụ trách (Region Scope Guard)</span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ràng buộc dữ liệu báo giá, cước phí và đối tác theo vùng địa lý. Tài khoản chỉ được xem và xử lý báo giá thuộc vùng được gán.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {REGION_SCOPES_LIST.map((region) => {
              const isChecked = formData.regionScopes.includes(region.id);
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleToggleRegion(region.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
                    isChecked
                      ? "bg-blue-50/80 border-primary text-foreground shadow-2xs dark:bg-blue-950/40"
                      : "bg-surface border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="mt-0.5 rounded text-primary focus:ring-primary h-3.5 w-3.5 shrink-0 pointer-events-none"
                  />
                  <div className="min-w-0">
                    <p className={`font-semibold text-xs ${isChecked ? "text-primary" : "text-foreground"}`}>
                      {region.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      Mã: {region.code}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trạng thái hoạt động */}
        <div className="flex items-center gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive !== false}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="rounded text-primary focus:ring-primary h-4 w-4"
            />
            <span className="font-semibold text-xs text-foreground">
              Kích hoạt tài khoản ngay
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
