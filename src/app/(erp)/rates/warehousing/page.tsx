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
  getWarehouseRatesAction,
  getWarehouseLocationsAction,
  getWarehouseProvidersAction,
  getCommoditiesAction,
  toggleWarehouseRateStatusAction,
  deleteWarehouseRateAction,
} from "@/features/master-data/actions";

import {
  WarehouseRateItem,
  WarehouseTypeFilter,
  WarehouseServiceCodeFilter,
  WarehouseRateStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { WarehouseRatesFilterBar } from "./_components/warehouse-rates-filter-bar";
import { WarehouseRatesTable } from "./_components/warehouse-rates-table";
import { WarehouseRateDetailDrawer } from "./_components/warehouse-rate-detail-drawer";
import { WarehouseRateFormDialog } from "./_components/warehouse-rate-form-dialog";

export default function WarehouseRatesPage() {
  useDocumentTitle("Biểu phí Dịch vụ Kho bãi & Lưu trữ");

  const [rates, setRates] = useState<WarehouseRateItem[]>([]);
  const [providerOptions, setProviderOptions] = useState<{ providerId: string; providerName: string }[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<{ locationId: string; locationName: string; locationType: string }[]>([]);
  const [commodityOptions, setCommodityOptions] = useState<{ id: string; name: string }[]>([]);

  // Drawer, Form & Dialog states
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<WarehouseRateItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<WarehouseRateItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<WarehouseRateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseRateItem | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<WarehouseTypeFilter>("ALL");
  const [selectedWarehouse, setSelectedWarehouse] = useState("ALL");
  const [selectedServiceCode, setSelectedServiceCode] = useState<WarehouseServiceCodeFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<WarehouseRateStatusFilter>("ALL");

  const { loading, error, runLoad } = useListFeedback("warehouse_rates_cache");

  // Nạp dữ liệu
  const loadData = useCallback(() => {
    runLoad(async () => {
      const [rateRes, provRes, whRes, comRes] = await Promise.all([
        getWarehouseRatesAction(),
        getWarehouseProvidersAction(),
        getWarehouseLocationsAction(),
        getCommoditiesAction(),
      ]);

      if (rateRes.success && rateRes.data) {
        setRates(rateRes.data);
      } else {
        throw new Error(rateRes.error || "Không thể tải biểu phí Kho bãi.");
      }

      if (provRes.success && provRes.data) {
        setProviderOptions(provRes.data);
      }

      if (whRes.success && whRes.data) {
        setWarehouseOptions(whRes.data);
      }

      if (comRes.success && comRes.data) {
        setCommodityOptions(
          comRes.data.map((c: { commodityId?: string; id?: string; name: string }) => ({
            id: c.commodityId || c.id || "",
            name: c.name,
          }))
        );
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Danh sách các Kho bãi phục vụ bộ lọc
  const warehouseFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const wh of warehouseOptions) {
      map.set(wh.locationId, wh.locationName);
    }
    for (const r of rates) {
      if (!map.has(r.warehouseId)) {
        map.set(r.warehouseId, r.warehouseName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [warehouseOptions, rates]);

  // Bộ đếm theo Loại kho
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of rates) {
      counts[item.warehouseType] = (counts[item.warehouseType] || 0) + 1;
    }
    return counts;
  }, [rates]);

  // Lọc dữ liệu client-side với Accent-Insensitive
  const filteredRates = useMemo(() => {
    return rates.filter((item) => {
      // 1. Lọc theo Loại kho
      if (selectedType !== "ALL" && item.warehouseType !== selectedType) {
        return false;
      }

      // 2. Lọc theo Kho bãi
      if (selectedWarehouse !== "ALL" && item.warehouseId !== selectedWarehouse) {
        return false;
      }

      // 3. Lọc theo Nhóm dịch vụ
      if (selectedServiceCode !== "ALL" && item.serviceCode !== selectedServiceCode) {
        return false;
      }

      // 4. Lọc theo Trạng thái
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) {
        return false;
      }

      // 5. Tìm kiếm Accent-Insensitive
      if (searchTerm.trim()) {
        const cleanSearch = removeVietnameseTones(searchTerm.trim());
        const targetString = removeVietnameseTones(
          `${item.warehouseName} ${item.providerName} ${item.serviceName} ${item.commodityName} ${item.notes || ""}`
        );
        if (!targetString.includes(cleanSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [rates, selectedType, selectedWarehouse, selectedServiceCode, selectedStatus, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedType("ALL");
    setSelectedWarehouse("ALL");
    setSelectedServiceCode("ALL");
    setSelectedStatus("ALL");
  };

  const handleCreate = () => {
    setSelectedEditItem(null);
    setIsFormOpen(true);
  };

  const handleView = (rate: WarehouseRateItem) => {
    setSelectedDrawerItem(rate);
  };

  const handleEdit = (rate: WarehouseRateItem) => {
    setSelectedDrawerItem(null);
    setSelectedEditItem(rate);
    setIsFormOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await toggleWarehouseRateStatusAction(toggleTarget.rateId, newStatus);
      if (res.success) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.error || "Không thể cập nhật trạng thái.");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi đổi trạng thái.");
    } finally {
      setToggleTarget(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteWarehouseRateAction(deleteTarget.rateId);
      if (res.success) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.error || "Không thể xóa biểu phí.");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi xóa biểu phí.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header chuẩn: Đã tự responsive rớt dòng trên mobile */}
      <PageHeader
        title="Biểu phí Kho bãi & Lưu trữ"
        description="Định mức chi phí lưu kho, bốc dỡ, xếp dỡ, phân loại và các dịch vụ giá trị gia tăng tại hệ thống kho Chu Lai Hub."
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onClick={loadData} loading={loading} />
            <Button
              variant="primary"
              onClick={handleCreate}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới biểu phí</span>
            </Button>
          </div>
        }
      />

      {/* 2. Thanh lọc & tìm kiếm */}
      <WarehouseRatesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}
        warehouseOptions={warehouseFilterOptions}
        selectedServiceCode={selectedServiceCode}
        onServiceCodeChange={setSelectedServiceCode}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        typeCounts={typeCounts}
        totalCount={rates.length}
        filteredCount={filteredRates.length}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Bảng dữ liệu với loading/error feedback & Empty State */}
      <WarehouseRatesTable
        rates={filteredRates}
        loading={loading}
        error={error}
        onRetry={loadData}
        onView={handleView}
        onEdit={handleEdit}
        onToggleStatus={(rate) => setToggleTarget(rate)}
        onDelete={(rate) => setDeleteTarget(rate)}
        onResetFilters={handleResetFilters}
        onCreateNew={handleCreate}
      />

      {/* 4. Slide-over Drawer xem chi tiết */}
      <WarehouseRateDetailDrawer
        rate={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        onEdit={handleEdit}
        onToggleStatus={(rate) => setToggleTarget(rate)}
      />

      {/* 5. Modal Form Thêm mới / Sửa */}
      <WarehouseRateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rate={selectedEditItem}
        providerOptions={providerOptions}
        warehouseOptions={warehouseOptions}
        commodityOptions={commodityOptions}
        onSuccess={loadData}
      />

      {/* 6. Confirm Dialog đổi trạng thái */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={toggleTarget?.status === "ACTIVE" ? "Tạm ngưng biểu phí Kho bãi" : "Kích hoạt lại biểu phí Kho bãi"}
        description={`Bạn có chắc chắn muốn chuyển trạng thái biểu phí [${toggleTarget?.serviceName} - ${toggleTarget?.warehouseName}] sang [${
          toggleTarget?.status === "ACTIVE" ? "Hết hiệu lực" : "Đang áp dụng"
        }]?`}
        confirmLabel={toggleTarget?.status === "ACTIVE" ? "Tạm ngưng" : "Kích hoạt"}
        variant={toggleTarget?.status === "ACTIVE" ? "destructive" : "primary"}
        onConfirm={handleConfirmToggle}
      />

      {/* 7. Confirm Dialog xóa biểu phí */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa biểu phí dịch vụ Kho bãi"
        description={`Hành động này sẽ xóa vĩnh viễn biểu phí [${deleteTarget?.serviceName} - ${deleteTarget?.warehouseName}]. Bạn có chắc chắn muốn thực hiện?`}
        confirmLabel="Xác nhận xóa"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

