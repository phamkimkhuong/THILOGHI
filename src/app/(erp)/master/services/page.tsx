"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  PageHeader,
  RefreshButton,
  useListFeedback,
  TableFeedback,
  TableContainer,
} from "@/components/ui/list-page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  getMasterServicesAction,
  toggleServiceStatusAction,
} from "@/features/master-data/actions";

import {
  MasterServicePackage,
  ServiceCategoryFilter,
  ServiceStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { ServicesFilterBar } from "./_components/services-filter-bar";
import { ServicesTable } from "./_components/services-table";
import { ServicesDetailDrawer } from "./_components/services-detail-drawer";
import { ServicesFormDialog } from "./_components/services-form-dialog";

export default function MasterServicesPage() {
  useDocumentTitle("Danh mục Dịch vụ");

  const [services, setServices] = useState<MasterServicePackage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategoryFilter>("ALL");
  const [selectedStatus, setSelectedStatus] =
    useState<ServiceStatusFilter>("ALL");

  // State Drawer & Form & Confirm Dialog
  const [selectedDrawerItem, setSelectedDrawerItem] =
    useState<MasterServicePackage | null>(null);
  const [selectedEditItem, setSelectedEditItem] =
    useState<MasterServicePackage | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] =
    useState<MasterServicePackage | null>(null);

  const { loading, error, runLoad } = useListFeedback(
    "master_services_cache"
  );

  const loadData = useCallback(async () => {
    runLoad(async (isCurrent) => {
      const res = await getMasterServicesAction();
      if (!res.success) throw new Error(res.error);
      if (isCurrent()) {
        setServices(res.data);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bộ đếm theo từng nhóm
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of services) {
      counts[item.serviceCategory] = (counts[item.serviceCategory] || 0) + 1;
    }
    return counts;
  }, [services]);

  // Lọc dữ liệu client-side với Accent-Insensitive
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      // 1. Lọc theo nhóm
      if (
        selectedCategory !== "ALL" &&
        item.serviceCategory !== selectedCategory
      ) {
        return false;
      }

      // 2. Lọc theo trạng thái
      if (selectedStatus === "ACTIVE" && !item.isActive) return false;
      if (selectedStatus === "INACTIVE" && item.isActive) return false;

      // 3. Tìm kiếm tiếng Việt không dấu
      if (searchTerm.trim()) {
        const normQuery = removeVietnameseTones(searchTerm.trim());
        const normCode = removeVietnameseTones(item.serviceId);
        const normName = removeVietnameseTones(item.serviceName);
        const normDesc = removeVietnameseTones(item.description);

        const match =
          normCode.includes(normQuery) ||
          normName.includes(normQuery) ||
          normDesc.includes(normQuery);

        if (!match) return false;
      }

      return true;
    });
  }, [services, selectedCategory, selectedStatus, searchTerm]);

  const handleOpenCreate = () => {
    setSelectedEditItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: MasterServicePackage) => {
    setSelectedEditItem(item);
    setIsFormOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const newStatus = !toggleTarget.isActive;

    try {
      const res = await toggleServiceStatusAction(
        toggleTarget.serviceId,
        newStatus
      );
      if (!res.success) throw new Error(res.error);

      toast.success(res.message);
      setToggleTarget(null);
      loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái"
      );
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Header Trang Chuẩn SalesFlow Theme */}
      <PageHeader
        title="Danh mục Dịch vụ"
        description="Quản lý 8 gói dịch vụ thương mại chuẩn hoá của THILOGI Logistics OS"
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton loading={loading} onClick={loadData} />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm gói dịch vụ</span>
            </Button>
          </div>
        }
      />

      {/* 2. Thanh Lọc & Tìm Kiếm Responsive */}
      <ServicesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        categoryCounts={categoryCounts}
        totalCount={services.length}
        filteredCount={filteredServices.length}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Phản Hồi Trạng Thái Bảng & Dữ Liệu */}
      {error ? (
        <TableContainer ariaLabel="Bảng danh mục 8 gói dịch vụ chuẩn">
          <table className="erp-table w-full text-left text-xs font-sans">
            <tbody>
              <TableFeedback columns={8} loading={false} error={error} onRetry={loadData} />
            </tbody>
          </table>
        </TableContainer>
      ) : (
        <ServicesTable
          services={filteredServices}
          loading={loading}
          onView={(item) => setSelectedDrawerItem(item)}
          onEdit={(item) => handleOpenEdit(item)}
          onToggleStatus={(item) => setToggleTarget(item)}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* 4. Slide-out Drawer Xem Chi Tiết Gói Dịch Vụ */}
      <ServicesDetailDrawer
        service={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        onEdit={(item) => handleOpenEdit(item)}
        onToggleStatus={(item) => setToggleTarget(item)}
      />

      {/* 5. Modal Dialog Tạo Mới & Chỉnh Sửa Gói Dịch Vụ */}
      <ServicesFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        service={selectedEditItem}
        onSuccess={loadData}
      />

      {/* 6. Hộp Thoại Xác Nhận Bật / Tắt Dịch Vụ */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={
          toggleTarget?.isActive
            ? "Xác nhận tạm dừng gói dịch vụ"
            : "Xác nhận kích hoạt gói dịch vụ"
        }
        description={
          toggleTarget ? (
            <span>
              Bạn có chắc chắn muốn{" "}
              <strong>
                {toggleTarget.isActive ? "tạm dừng" : "kích hoạt lại"}
              </strong>{" "}
              gói dịch vụ{" "}
              <strong className="text-primary">
                [{toggleTarget.serviceId}] {toggleTarget.serviceName}
              </strong>
              ? Khi tạm dừng, nhân viên Sales sẽ không thể chọn gói này trên các
              báo giá mới.
            </span>
          ) : (
            ""
          )
        }
        confirmLabel={
          toggleTarget?.isActive ? "Tạm dừng dịch vụ" : "Kích hoạt dịch vụ"
        }
        variant={toggleTarget?.isActive ? "destructive" : "primary"}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
