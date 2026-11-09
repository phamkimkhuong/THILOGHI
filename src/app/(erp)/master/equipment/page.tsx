"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  PageHeader,
  RefreshButton,
  useListFeedback,
  TableFeedback,
} from "@/components/ui/list-page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  getMasterEquipmentTypesAction,
  toggleEquipmentTypeStatusAction,
} from "@/features/master-data/actions";

import {
  MasterEquipmentTypeItem,
  EquipmentCategoryFilter,
  EquipmentStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { EquipmentFilterBar } from "./_components/equipment-filter-bar";
import { EquipmentTable } from "./_components/equipment-table";
import { EquipmentDetailDrawer } from "./_components/equipment-detail-drawer";
import { EquipmentFormDialog } from "./_components/equipment-form-dialog";

export default function MasterEquipmentPage() {
  useDocumentTitle("Danh mục Loại thiết bị & Container");

  const [items, setItems] = useState<MasterEquipmentTypeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<EquipmentCategoryFilter>("ALL");
  const [selectedStatus, setSelectedStatus] =
    useState<EquipmentStatusFilter>("ALL");

  // State Drawer & Form & Confirm Dialog
  const [selectedDrawerItem, setSelectedDrawerItem] =
    useState<MasterEquipmentTypeItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] =
    useState<MasterEquipmentTypeItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] =
    useState<MasterEquipmentTypeItem | null>(null);

  const { loading, error, runLoad } = useListFeedback(
    "master_equipment_types_cache"
  );

  const loadData = useCallback(async () => {
    runLoad(async (isCurrent) => {
      const res = await getMasterEquipmentTypesAction();
      if (!res.success) throw new Error(res.error);
      if (isCurrent()) {
        setItems(res.data);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bộ đếm theo từng nhóm
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of items) {
      counts[it.category] = (counts[it.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Lọc dữ liệu client-side với Accent-Insensitive
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (selectedCategory !== "ALL" && it.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus === "ACTIVE" && !it.isActive) return false;
      if (selectedStatus === "INACTIVE" && it.isActive) return false;

      if (searchTerm.trim()) {
        const normQuery = removeVietnameseTones(searchTerm.trim());
        const normCode = removeVietnameseTones(it.equipmentTypeId);
        const normName = removeVietnameseTones(it.equipmentName);
        const normAliases = (it.aliases || []).map(removeVietnameseTones).join(" ");

        const match =
          normCode.includes(normQuery) ||
          normName.includes(normQuery) ||
          normAliases.includes(normQuery);

        if (!match) return false;
      }

      return true;
    });
  }, [items, selectedCategory, selectedStatus, searchTerm]);

  const handleToggleConfirm = async () => {
    if (!toggleTarget) return;
    const newStatus = !toggleTarget.isActive;
    try {
      const res = await toggleEquipmentTypeStatusAction(
        toggleTarget.equipmentTypeId,
        newStatus
      );
      if (!res.success) throw new Error(res.error);
      toast.success(res.message);
      setToggleTarget(null);
      if (selectedDrawerItem?.equipmentTypeId === toggleTarget.equipmentTypeId) {
        setSelectedDrawerItem((prev) => (prev ? { ...prev, isActive: newStatus } : null));
      }
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    }
  };

  return (
    <div className="space-y-4 font-sans">
      <PageHeader
        title="Danh mục Loại thiết bị & Container"
        description="Quản lý và chuẩn hóa các loại container, xe tải và phương tiện vận tải toàn hệ thống"
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton loading={loading} onClick={loadData} />
            <Button
              size="sm"
              onClick={() => {
                setSelectedEditItem(null);
                setIsFormOpen(true);
              }}
              className="bg-[#2672df] hover:bg-blue-600 text-white font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Thêm loại thiết bị
            </Button>
          </div>
        }
      />

      <EquipmentFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        categoryCounts={categoryCounts}
        totalCount={items.length}
        filteredCount={filteredItems.length}
        onResetFilters={() => {
          setSearchTerm("");
          setSelectedCategory("ALL");
          setSelectedStatus("ALL");
        }}
      />

      <TableFeedback
        columns={8}
        loading={loading}
        error={error}
        onRetry={loadData}
      />

      {!loading && !error && (
        <EquipmentTable
          items={filteredItems}
          loading={loading}
          onView={setSelectedDrawerItem}
          onEdit={(it) => {
            setSelectedEditItem(it);
            setIsFormOpen(true);
          }}
          onToggleStatus={setToggleTarget}
          onResetFilters={() => {
            setSearchTerm("");
            setSelectedCategory("ALL");
            setSelectedStatus("ALL");
          }}
        />
      )}

      <EquipmentDetailDrawer
        item={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        onEdit={(it) => {
          setSelectedEditItem(it);
          setIsFormOpen(true);
        }}
        onToggleStatus={setToggleTarget}
      />

      <EquipmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={selectedEditItem}
        onSuccess={loadData}
      />

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={
          toggleTarget?.isActive
            ? "Tạm dừng áp dụng thiết bị?"
            : "Kích hoạt lại thiết bị?"
        }
        description={`Bạn có chắc muốn ${
          toggleTarget?.isActive ? "tạm dừng" : "kích hoạt"
        } loại thiết bị [${toggleTarget?.equipmentTypeId} - ${
          toggleTarget?.equipmentName
        }]?`}
        confirmLabel={toggleTarget?.isActive ? "Tạm dừng" : "Kích hoạt"}
        variant={toggleTarget?.isActive ? "destructive" : "primary"}
        onConfirm={handleToggleConfirm}
      />
    </div>
  );
}

