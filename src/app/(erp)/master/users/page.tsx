"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  PageHeader,
  RefreshButton,
  useListFeedback,
} from "@/components/ui/list-page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  getUsersAction,
  toggleUserStatusAction,
  type UserItem,
} from "@/features/master-data/user-actions";

import {
  type UserRoleFilter,
  type UserStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { UserFilterBar } from "./_components/user-filter-bar";
import { UserTable } from "./_components/user-table";
import { UserDetailDrawer } from "./_components/user-detail-drawer";
import { UserFormDialog } from "./_components/user-form-dialog";
import { UserPasswordDialog } from "./_components/user-password-dialog";

export default function MasterUsersPage() {
  useDocumentTitle("Quản lý Người dùng & Phân quyền");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRoleFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<UserStatusFilter>("ALL");

  // State Drawers & Modals
  const [drawerUser, setDrawerUser] = useState<UserItem | null>(null);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { loading, error, runLoad } = useListFeedback("master_users_cache");

  const loadData = useCallback(async () => {
    runLoad(async (isCurrent) => {
      const res = await getUsersAction();
      if (!res.success) throw new Error(res.error);
      if (isCurrent()) {
        setUsers(res.data);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bộ đếm theo vai trò
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of users) {
      counts[u.role] = (counts[u.role] || 0) + 1;
    }
    return counts;
  }, [users]);

  // Bộ lọc client-side với Accent-Insensitive
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRole !== "ALL" && u.role !== selectedRole) return false;
      if (selectedStatus === "ACTIVE" && !u.isActive) return false;
      if (selectedStatus === "INACTIVE" && u.isActive) return false;

      if (searchTerm.trim()) {
        const query = removeVietnameseTones(searchTerm.trim());
        const normName = removeVietnameseTones(u.fullName || "");
        const normUser = removeVietnameseTones(u.username || "");
        const normEmail = removeVietnameseTones(u.email || "");
        const normDept = removeVietnameseTones(u.department || "");
        const normComp = removeVietnameseTones(u.company || "");

        const match =
          normName.includes(query) ||
          normUser.includes(query) ||
          normEmail.includes(query) ||
          normDept.includes(query) ||
          normComp.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [users, selectedRole, selectedStatus, searchTerm]);

  const handleConfirmToggleStatus = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      const res = await toggleUserStatusAction(toggleTarget.userId);
      if (!res.success) {
        throw new Error(res.error);
      }
      toast.success(res.message);
      setToggleTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Trang */}
      <PageHeader
        title="Quản lý Người dùng & Phân quyền"
        description="Quản lý danh sách cán bộ nhân viên, vai trò nghiệp vụ ERP và phạm vi phân vùng phụ trách"
        actions={
          <>
            <RefreshButton onClick={loadData} loading={loading} />
            <Button
              onClick={() => {
                setEditUser(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Thêm người dùng
            </Button>
          </>
        }
      />

      {/* 2. Thanh lọc Đa tiêu chí */}
      <UserFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        roleCounts={roleCounts}
        totalCount={users.length}
      />

      {/* 3. Bảng dữ liệu người dùng */}
      <UserTable
        users={filteredUsers}
        loading={loading}
        error={error}
        onRetry={loadData}
        onSelectDrawer={(u) => setDrawerUser(u)}
        onSelectEdit={(u) => {
          setEditUser(u);
          setIsFormOpen(true);
        }}
        onSelectPassword={(u) => {
          setPasswordUser(u);
          setIsPasswordOpen(true);
        }}
        onToggleLock={(u) => setToggleTarget(u)}
        onCreateNew={() => {
          setEditUser(null);
          setIsFormOpen(true);
        }}
      />

      {/* 4. Slide-over Drawer xem nhanh hồ sơ */}
      <UserDetailDrawer
        open={Boolean(drawerUser)}
        onClose={() => setDrawerUser(null)}
        user={drawerUser}
        onEdit={(u) => {
          setEditUser(u);
          setIsFormOpen(true);
        }}
        onResetPassword={(u) => {
          setPasswordUser(u);
          setIsPasswordOpen(true);
        }}
        onToggleLock={(u) => setToggleTarget(u)}
      />

      {/* 5. Modal Form Tạo mới / Chỉnh sửa */}
      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={editUser}
        onSuccess={loadData}
      />

      {/* 6. Modal Đổi mật khẩu nhanh */}
      <UserPasswordDialog
        open={isPasswordOpen}
        onOpenChange={setIsPasswordOpen}
        user={passwordUser}
        onSuccess={loadData}
      />

      {/* 7. Dialog Xác nhận Khóa / Mở khóa tài khoản */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={toggleTarget?.isActive ? "Tạm khóa tài khoản người dùng" : "Kích hoạt lại tài khoản"}
        description={
          toggleTarget?.isActive ? (
            <span>
              Bạn có chắc chắn muốn tạm khóa tài khoản của cán bộ{" "}
              <strong>{toggleTarget.fullName}</strong> (@{toggleTarget.username})? Người dùng này sẽ không thể đăng nhập vào hệ thống THILOGI ERP.
            </span>
          ) : (
            <span>
              Kích hoạt lại quyền truy cập hệ thống cho cán bộ{" "}
              <strong>{toggleTarget?.fullName}</strong> (@{toggleTarget?.username})?
            </span>
          )
        }
        confirmLabel={toggleTarget?.isActive ? "Tạm khóa tài khoản" : "Kích hoạt lại"}
        cancelLabel="Hủy bỏ"
        variant={toggleTarget?.isActive ? "destructive" : "primary"}
        loading={toggling}
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  );
}
