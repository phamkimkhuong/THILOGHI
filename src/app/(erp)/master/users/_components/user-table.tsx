"use client";

import { TableContainer, TableFeedback } from "@/components/ui/list-page";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Users,
  Edit2,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  Plus,
} from "lucide-react";
import {
  type UserItem,
  getRoleBadge,
  getRegionScopeBadge,
} from "./types";

interface UserTableProps {
  users: UserItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectDrawer: (user: UserItem) => void;
  onSelectEdit: (user: UserItem) => void;
  onSelectPassword: (user: UserItem) => void;
  onToggleLock: (user: UserItem) => void;
  onCreateNew: () => void;
}

export function UserTable({
  users,
  loading,
  error,
  onRetry,
  onSelectDrawer,
  onSelectEdit,
  onSelectPassword,
  onToggleLock,
  onCreateNew,
}: UserTableProps) {
  if (!loading && !error && users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Không tìm thấy người dùng phù hợp"
        description="Không có tài khoản nhân sự nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
        action={
          <Button onClick={onCreateNew} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Thêm người dùng mới
          </Button>
        }
      />
    );
  }

  return (
    <TableContainer ariaLabel="Bảng danh sách tài khoản người dùng">
      <table className="erp-table">
        <thead>
          <tr>
            <th className="w-12 text-center">STT</th>
            <th className="min-w-[200px]">Cán bộ nhân viên</th>
            <th className="min-w-[150px]">Vai trò</th>
            <th className="min-w-[220px]">Phân vùng phụ trách</th>
            <th className="min-w-[180px]">Đơn vị & Phòng ban</th>
            <th className="min-w-[160px]">Email</th>
            <th className="w-28 text-center">Trạng thái</th>
            <th className="w-36 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading || error ? (
            <TableFeedback
              columns={8}
              loading={loading}
              error={error}
              onRetry={onRetry}
            />
          ) : (
            users.map((u, idx) => {
              const roleBadge = getRoleBadge(u.role);
              const initials = u.fullName
                ? u.fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(-2)
                    .map((n) => n[0]?.toUpperCase())
                    .join("")
                : u.username.slice(0, 2).toUpperCase();

              return (
                <tr key={u.userId} className="hover:bg-surface-hover/70 transition-colors">
                  {/* STT */}
                  <td className="text-center text-xs text-muted-foreground font-mono">
                    {idx + 1}
                  </td>

                  {/* Cán bộ nhân viên */}
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 flex items-center justify-center text-xs font-bold shrink-0 border border-blue-200 dark:border-blue-800">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectDrawer(u)}
                          className="font-semibold text-foreground hover:text-primary transition-colors text-left truncate block cursor-pointer"
                        >
                          {u.fullName}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                          <span>@{u.username}</span>
                          <span className="text-border">•</span>
                          <span>{u.userId}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Vai trò */}
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadge.className}`}
                    >
                      {roleBadge.label}
                    </span>
                  </td>

                  {/* Phân vùng phụ trách */}
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                      {u.regionScopes && u.regionScopes.length > 0 ? (
                        u.regionScopes.map((scope) => {
                          const badge = getRegionScopeBadge(scope);
                          return (
                            <span
                              key={scope}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Chưa gán phân vùng
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Đơn vị & Phòng ban */}
                  <td>
                    <div className="text-xs">
                      <p className="font-medium text-foreground truncate max-w-[180px]">
                        {u.company || "THILOGI Chu Lai"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                        {u.department || "Khối Vận hành"}
                      </p>
                    </div>
                  </td>

                  {/* Email */}
                  <td>
                    <span className="text-xs text-muted-foreground font-mono truncate block max-w-[160px]">
                      {u.email || "—"}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="text-center">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Tạm khóa
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Xem chi tiết drawer */}
                      <button
                        type="button"
                        onClick={() => onSelectDrawer(u)}
                        title="Xem hồ sơ nhân sự"
                        aria-label="Xem hồ sơ nhân sự"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Chỉnh sửa */}
                      <button
                        type="button"
                        onClick={() => onSelectEdit(u)}
                        title="Chỉnh sửa thông tin"
                        aria-label="Chỉnh sửa thông tin"
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Đặt lại mật khẩu */}
                      <button
                        type="button"
                        onClick={() => onSelectPassword(u)}
                        title="Đặt lại mật khẩu"
                        aria-label="Đặt lại mật khẩu"
                        className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      {/* Khóa / Mở khóa */}
                      <button
                        type="button"
                        onClick={() => onToggleLock(u)}
                        title={u.isActive ? "Tạm khóa tài khoản" : "Kích hoạt lại tài khoản"}
                        aria-label={u.isActive ? "Tạm khóa tài khoản" : "Kích hoạt lại tài khoản"}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          u.isActive
                            ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        }`}
                      >
                        {u.isActive ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </TableContainer>
  );
}
