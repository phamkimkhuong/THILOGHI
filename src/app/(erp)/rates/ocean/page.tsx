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
  getOceanRatesAction,
  getOceanCarriersAction,
  getOceanPortsAction,
  toggleOceanRateStatusAction,
  deleteOceanRateAction,
} from "@/features/master-data/actions";

import {
  OceanRateItem,
  ContainerTypeFilter,
  OceanRateStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { OceanRatesFilterBar } from "./_components/ocean-rates-filter-bar";
import { OceanRatesTable } from "./_components/ocean-rates-table";
import { OceanRateDetailDrawer } from "./_components/ocean-rate-detail-drawer";
import { OceanRateFormDialog } from "./_components/ocean-rate-form-dialog";

export default function OceanRatesPage() {
  useDocumentTitle("Biểu cước Vận tải biển");

  const [rates, setRates] = useState<OceanRateItem[]>([]);
  const [carrierOptions, setCarrierOptions] = useState<{ carrierId: string; carrierName: string }[]>([]);
  const [portOptions, setPortOptions] = useState<{ portId: string; portName: string; countryCode: string }[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState("ALL");
  const [selectedPol, setSelectedPol] = useState("ALL");
  const [selectedPod, setSelectedPod] = useState("ALL");
  const [selectedContainerType, setSelectedContainerType] = useState<ContainerTypeFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<OceanRateStatusFilter>("ALL");

  // State Drawer & Form & Confirm Dialog
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<OceanRateItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<OceanRateItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<OceanRateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OceanRateItem | null>(null);

  const { loading, error, runLoad } = useListFeedback("ocean_rates_cache");

  const loadData = useCallback(async () => {
    runLoad(async (isCurrent) => {
      const [ratesRes, carriersRes, portsRes] = await Promise.all([
        getOceanRatesAction(),
        getOceanCarriersAction(),
        getOceanPortsAction(),
      ]);

      if (!ratesRes.success) throw new Error(ratesRes.error);

      if (isCurrent()) {
        setRates(ratesRes.data);
        if (carriersRes.success && carriersRes.data.length > 0) {
          setCarrierOptions(carriersRes.data);
        }
        if (portsRes.success && portsRes.data.length > 0) {
          setPortOptions(portsRes.data);
        }
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lọc dữ liệu client-side với Accent-Insensitive
  const filteredRates = useMemo(() => {
    return rates.filter((item) => {
      if (selectedCarrier !== "ALL" && item.carrierId !== selectedCarrier) {
        return false;
      }
      if (selectedPol !== "ALL" && item.polId !== selectedPol) {
        return false;
      }
      if (selectedPod !== "ALL" && item.podId !== selectedPod) {
        return false;
      }
      if (selectedContainerType !== "ALL" && item.containerType !== selectedContainerType) {
        return false;
      }
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) {
        return false;
      }

      if (searchTerm.trim()) {
        const queryNorm = removeVietnameseTones(searchTerm.trim());
        const matchField =
          removeVietnameseTones(item.carrierId).includes(queryNorm) ||
          removeVietnameseTones(item.carrierName).includes(queryNorm) ||
          removeVietnameseTones(item.polName).includes(queryNorm) ||
          removeVietnameseTones(item.polId).includes(queryNorm) ||
          removeVietnameseTones(item.podName).includes(queryNorm) ||
          removeVietnameseTones(item.podId).includes(queryNorm) ||
          removeVietnameseTones(item.commodityName).includes(queryNorm) ||
          removeVietnameseTones(item.containerType).includes(queryNorm) ||
          removeVietnameseTones(item.notes || "").includes(queryNorm);

        if (!matchField) return false;
      }

      return true;
    });
  }, [
    rates,
    selectedCarrier,
    selectedPol,
    selectedPod,
    selectedContainerType,
    selectedStatus,
    searchTerm,
  ]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCarrier("ALL");
    setSelectedPol("ALL");
    setSelectedPod("ALL");
    setSelectedContainerType("ALL");
    setSelectedStatus("ALL");
  };

  const handleOpenCreateModal = () => {
    setSelectedEditItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (item: OceanRateItem) => {
    setSelectedEditItem(item);
    setIsFormOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await toggleOceanRateStatusAction(toggleTarget.rateId, newStatus);
      if (res.success) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.error || "Lỗi cập nhật trạng thái");
      }
    } catch {
      toast.error("Lỗi khi kết nối đến máy chủ");
    } finally {
      setToggleTarget(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteOceanRateAction(deleteTarget.rateId);
      if (res.success) {
        toast.success(res.message);
        loadData();
        if (selectedDrawerItem?.rateId === deleteTarget.rateId) {
          setSelectedDrawerItem(null);
        }
      } else {
        toast.error(res.error || "Lỗi xóa biểu cước");
      }
    } catch {
      toast.error("Lỗi khi kết nối đến máy chủ");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Header trang */}
      <PageHeader
        title="Biểu cước Vận tải biển"
        description="Quản lý giá mua đầu vào vận tải biển quốc tế (Chu Lai - Trung Quốc, Hàn Quốc...) & feeder nội địa từ các hãng tàu (SITC, RCL, CMA, THILOGI...)"
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onClick={loadData} loading={loading} />
            <Button onClick={handleOpenCreateModal} className="text-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm biểu cước biển mới
            </Button>
          </div>
        }
      />

      {/* 2. Thanh lọc và tìm kiếm */}
      <OceanRatesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCarrier={selectedCarrier}
        onCarrierChange={setSelectedCarrier}
        carrierOptions={carrierOptions}
        selectedPol={selectedPol}
        onPolChange={setSelectedPol}
        selectedPod={selectedPod}
        onPodChange={setSelectedPod}
        portOptions={portOptions}
        selectedContainerType={selectedContainerType}
        onContainerTypeChange={setSelectedContainerType}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        totalCount={rates.length}
        filteredCount={filteredRates.length}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Bảng biểu cước */}
      <OceanRatesTable
        rates={filteredRates}
        loading={loading}
        error={error}
        onRetry={loadData}
        onView={(rate) => setSelectedDrawerItem(rate)}
        onEdit={(rate) => handleOpenEditModal(rate)}
        onToggleStatus={(rate) => setToggleTarget(rate)}
        onDelete={(rate) => setDeleteTarget(rate)}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Slide-over Drawer xem chi tiết */}
      <OceanRateDetailDrawer
        rate={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        onEdit={(rate) => handleOpenEditModal(rate)}
        onToggleStatus={(rate) => setToggleTarget(rate)}
      />

      {/* 6. Modal Form Thêm mới / Sửa */}
      <OceanRateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rate={selectedEditItem}
        carrierOptions={carrierOptions}
        portOptions={portOptions}
        onSuccess={loadData}
      />

      {/* 7. Dialog Xác nhận đổi trạng thái */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={toggleTarget?.status === "ACTIVE" ? "Tạm ngưng biểu cước biển" : "Kích hoạt lại biểu cước biển"}
        description={`Bạn có chắc chắn muốn chuyển trạng thái biểu cước tuyến [${toggleTarget?.polName} -> ${toggleTarget?.podName}] của hãng tàu ${toggleTarget?.carrierId} sang [${
          toggleTarget?.status === "ACTIVE" ? "Hết hiệu lực" : "Đang áp dụng"
        }]?`}
        confirmLabel={toggleTarget?.status === "ACTIVE" ? "Tạm ngưng" : "Kích hoạt"}
        variant={toggleTarget?.status === "ACTIVE" ? "destructive" : "primary"}
        onConfirm={handleConfirmToggle}
      />

      {/* 8. Dialog Xác nhận xóa */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa biểu cước Vận tải biển"
        description={`Hành động này sẽ xóa vĩnh viễn biểu cước [${deleteTarget?.carrierId}: ${deleteTarget?.polName} -> ${deleteTarget?.podName} - ${deleteTarget?.commodityName}]. Bạn có chắc chắn muốn thực hiện?`}
        confirmLabel="Xác nhận xóa"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
