"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, RefreshButton, useListFeedback } from "@/components/ui/list-page";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import {
  getCommoditiesAction,
  toggleCommodityStatusAction,
  deleteCommodityAction,
} from "@/features/master-data/actions";
import { getCurrentUserAction } from "@/features/quotation/actions";

import { CommodityFilterBar } from "./_components/commodity-filter-bar";
import { CommodityTable } from "./_components/commodity-table";
import { CommodityDetailDrawer } from "./_components/commodity-detail-drawer";
import { CommodityFormDialog } from "./_components/commodity-form-dialog";
import {
  removeVietnameseTones,
  type CommodityRecord,
} from "./_components/types";

export default function MasterCommoditiesPage() {
  useDocumentTitle("Danh mục Hàng hóa");

  // Server State
  const [commodities, setCommodities] = useState<CommodityRecord[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // UI Modal / Drawer States
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<CommodityRecord | null>(null);

  // Confirm Dialog States
  const [deleteTarget, setDeleteTarget] = useState<CommodityRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<CommodityRecord | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("Bùi Hiếu");

  const { loading, error: loadError, runLoad } = useListFeedback("commodities_list");

  // Nạp dữ liệu từ Server Action
  const loadData = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const res = await getCommoditiesAction();
      if (!res.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      if (res.success) {
        setCommodities((res.data || []) as CommodityRecord[]);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
    void getCurrentUserAction().then((user) => {
      if (user?.fullName) setCurrentUserName(user.fullName);
    });
  }, [loadData]);

  // Danh sách các nhóm & thống kê số lượng
  const { categories, categoryCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    commodities.forEach((c) => {
      if (c.category) {
        counts[c.category] = (counts[c.category] || 0) + 1;
      }
    });
    return {
      categories: Object.keys(counts).sort((a, b) => a.localeCompare(b, "vi")),
      categoryCounts: counts,
    };
  }, [commodities]);

  // Bộ lọc thông minh tức thì (Tìm kiếm tiếng Việt không dấu & Tên tiếng Anh)
  const filteredCommodities = useMemo(() => {
    let list = [...commodities];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const qNorm = removeVietnameseTones(q);

      list = list.filter((c) => {
        const fields = [
          c.name,
          c.englishName,
          c.commodityId,
          c.category,
          c.specifications,
          c.origin,
          c.purpose,
          c.note,
        ].filter(Boolean) as string[];

        return fields.some((f) => {
          const lower = f.toLowerCase();
          return lower.includes(q) || removeVietnameseTones(lower).includes(qNorm);
        });
      });
    }

    if (selectedCategory !== "ALL") {
      list = list.filter((c) => c.category === selectedCategory);
    }

    if (selectedStatus !== "ALL") {
      list = list.filter((c) => c.status === selectedStatus);
    }

    return list;
  }, [commodities, searchTerm, selectedCategory, selectedStatus]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  };

  // Mở modal Thêm mới / Sửa
  const handleOpenCreate = () => {
    setEditingCommodity(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (comm: CommodityRecord) => {
    setEditingCommodity(comm);
    setIsFormOpen(true);
  };

  // Xóa hàng hóa (kèm FK Guard)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await deleteCommodityAction(deleteTarget.commodityId);
      if (!res.success) throw new Error(res.error || "Không thể xóa mặt hàng.");
      toast.success(res.message || `Đã xóa mặt hàng [${deleteTarget.name}].`);
      if (selectedCommodity?.commodityId === deleteTarget.commodityId) {
        setSelectedCommodity(null);
      }
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi xóa mặt hàng.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Đổi trạng thái phê duyệt
  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true);
    try {
      const res = await toggleCommodityStatusAction(toggleTarget.commodityId);
      if (!res.success) throw new Error(res.error || "Không thể đổi trạng thái.");
      toast.success(res.message || "Đã cập nhật trạng thái thành công!");
      if (selectedCommodity?.commodityId === toggleTarget.commodityId) {
        setSelectedCommodity({
          ...selectedCommodity,
          status: res.status || (selectedCommodity.status === "Đã duyệt" ? "Tạm ngưng" : "Đã duyệt"),
        });
      }
      setToggleTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái.");
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* 1. Header Trang & Thao tác Quản trị */}
      <PageHeader
        title="Danh mục Hàng hóa"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Thêm mặt hàng
            </Button>
            <RefreshButton onClick={loadData} loading={loading} />
          </div>
        }
      />

      {/* 2. Thanh Lọc Đa Chiều Thông Minh */}
      <CommodityFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        categoryCounts={categoryCounts}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        totalCount={commodities.length}
        filteredCount={filteredCommodities.length}
        onResetFilters={resetFilters}
      />

      {/* 3. Bảng Dữ Liệu Hàng Hóa Chuẩn SalesFlow */}
      <CommodityTable
        commodities={filteredCommodities}
        loading={loading}
        loadError={loadError}
        onRetry={loadData}
        onView={setSelectedCommodity}
        onEdit={handleOpenEdit}
        onToggle={setToggleTarget}
        onDelete={setDeleteTarget}
        filterKey={JSON.stringify([searchTerm, selectedCategory, selectedStatus])}
        totalOriginal={commodities.length}
        onResetFilters={resetFilters}
      />

      {/* 4. Slide-over Drawer Xem Chi Tiết */}
      <CommodityDetailDrawer
        commodity={selectedCommodity}
        onClose={() => setSelectedCommodity(null)}
        onEdit={handleOpenEdit}
        onToggle={setToggleTarget}
        onDelete={setDeleteTarget}
      />

      {/* 5. Modal Form Thêm / Sửa Hàng Hóa */}
      <CommodityFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingCommodity}
        categories={categories}
        currentUserName={currentUserName}
        onSuccess={loadData}
      />

      {/* 6. Hộp thoại Xác nhận Xóa (Foreign Key Guard) */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xác nhận xóa mặt hàng"
        description={`Bạn có chắc chắn muốn xóa mặt hàng [${deleteTarget?.name}] (${deleteTarget?.commodityId}) khỏi danh mục không? Thao tác này sẽ bị chặn nếu mặt hàng đã phát sinh báo giá.`}
        confirmLabel="Xác nhận xóa"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />

      {/* 7. Hộp thoại Xác nhận Đổi trạng thái */}
      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Đổi trạng thái áp dụng"
        description={`Bạn có muốn chuyển trạng thái mặt hàng [${toggleTarget?.name}] sang [${
          toggleTarget?.status === "Đã duyệt" ? "Tạm ngưng" : "Đã duyệt"
        }] không?`}
        confirmLabel="Đồng ý"
        variant="primary"
        loading={toggleLoading}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
