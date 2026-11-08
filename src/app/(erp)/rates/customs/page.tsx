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
  getCustomsRatesAction,
  getCustomsBrokersAction,
  getCustomsOfficesAction,
  getCommoditiesAction,
  toggleCustomsRateStatusAction,
  deleteCustomsRateAction,
} from "@/features/master-data/actions";

import {
  CustomsRateItem,
  CustomsProcedureFilter,
  CustomsServiceCodeFilter,
  CustomsRateStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { CustomsRatesFilterBar } from "./_components/customs-rates-filter-bar";
import { CustomsRatesTable } from "./_components/customs-rates-table";
import { CustomsRateDetailDrawer } from "./_components/customs-rate-detail-drawer";
import { CustomsRateFormDialog } from "./_components/customs-rate-form-dialog";

export default function CustomsRatesPage() {
  useDocumentTitle("Biểu phí Dịch vụ Hải quan");

  const [rates, setRates] = useState<CustomsRateItem[]>([]);
  const [providerOptions, setProviderOptions] = useState<{ providerId: string; providerName: string }[]>([]);
  const [officeOptions, setOfficeOptions] = useState<{ officeId: string; officeName: string; countryCode: string }[]>([]);
  const [commodityOptions, setCommodityOptions] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState<CustomsProcedureFilter>("ALL");
  const [selectedOffice, setSelectedOffice] = useState("ALL");
  const [selectedServiceCode, setSelectedServiceCode] = useState<CustomsServiceCodeFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<CustomsRateStatusFilter>("ALL");

  // State Drawer & Form & Confirm Dialog
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<CustomsRateItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<CustomsRateItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<CustomsRateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomsRateItem | null>(null);

  const { loading, error, runLoad } = useListFeedback("customs_rates_cache");

  const loadData = useCallback(async () => {
    runLoad(async (isCurrent) => {
      const [ratesRes, providersRes, officesRes, commRes] = await Promise.all([
        getCustomsRatesAction(),
        getCustomsBrokersAction(),
        getCustomsOfficesAction(),
        getCommoditiesAction(),
      ]);

      if (!ratesRes.success) throw new Error(ratesRes.error);

      if (isCurrent()) {
        setRates(ratesRes.data);
        if (providersRes.success && providersRes.data.length > 0) {
          setProviderOptions(providersRes.data);
        }
        if (officesRes.success && officesRes.data.length > 0) {
          setOfficeOptions(officesRes.data);
        }
        if (commRes.success && commRes.data) {
          setCommodityOptions(commRes.data.map((c) => c.name).filter(Boolean));
        }
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Danh sách các Chi cục Hải quan có trong dữ liệu và danh mục
  const officeFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const off of officeOptions) {
      map.set(off.officeId, off.officeName);
    }
    for (const r of rates) {
      if (!map.has(r.customsOfficeId)) {
        map.set(r.customsOfficeId, r.customsOfficeName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [officeOptions, rates]);

  // Bộ đếm theo loại hình tờ khai
  const procedureCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of rates) {
      counts[item.customsProcedure] = (counts[item.customsProcedure] || 0) + 1;
    }
    return counts;
  }, [rates]);

  // Lọc dữ liệu client-side với Accent-Insensitive
  const filteredRates = useMemo(() => {
    return rates.filter((item) => {
      // 1. Lọc theo Loại hình
      if (selectedProcedure !== "ALL" && item.customsProcedure !== selectedProcedure) {
        return false;
      }

      // 2. Lọc theo Chi cục
      if (selectedOffice !== "ALL" && item.customsOfficeId !== selectedOffice) {
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
          `${item.providerName} ${item.customsOfficeName} ${item.serviceName} ${item.commodityName} ${item.notes || ""}`
        );
        if (!targetString.includes(cleanSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [rates, selectedProcedure, selectedOffice, selectedServiceCode, selectedStatus, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedProcedure("ALL");
    setSelectedOffice("ALL");
    setSelectedServiceCode("ALL");
    setSelectedStatus("ALL");
  };

  const handleCreate = () => {
    setSelectedEditItem(null);
    setIsFormOpen(true);
  };

  const handleView = (rate: CustomsRateItem) => {
    setSelectedDrawerItem(rate);
  };

  const handleEdit = (rate: CustomsRateItem) => {
    setSelectedDrawerItem(null);
    setSelectedEditItem(rate);
    setIsFormOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const nextStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const res = await toggleCustomsRateStatusAction(toggleTarget.rateId, nextStatus);
      if (res.success) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.error || "Không thể cập nhật trạng thái biểu phí.");
      }
    } catch {
      toast.error("Lỗi khi kết nối đến máy chủ.");
    } finally {
      setToggleTarget(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await deleteCustomsRateAction(deleteTarget.rateId);
      if (res.success) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.error || "Không thể xóa biểu phí Hải quan.");
      }
    } catch {
      toast.error("Lỗi khi kết nối đến máy chủ.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Header trang chuẩn Thilogi ERP */}
      <PageHeader
        title="Biểu phí Dịch vụ Hải quan & Thủ tục Thông quan"
        description="Quản lý định mức đơn giá mua đầu vào cho các nghiệp vụ mở tờ khai, kiểm hóa, kiểm dịch và cấp chứng thư chuyên ngành tại Chi cục Hải quan."
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onClick={loadData} loading={loading} />
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              className="flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới biểu phí</span>
            </Button>
          </div>
        }
      />

      {/* 2. Thanh lọc & tìm kiếm */}
      <CustomsRatesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedProcedure={selectedProcedure}
        onProcedureChange={setSelectedProcedure}
        selectedOffice={selectedOffice}
        onOfficeChange={setSelectedOffice}
        officeOptions={officeFilterOptions}
        selectedServiceCode={selectedServiceCode}
        onServiceCodeChange={setSelectedServiceCode}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        procedureCounts={procedureCounts}
        totalCount={rates.length}
        filteredCount={filteredRates.length}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Bảng dữ liệu với loading/error feedback & Empty State */}
      <CustomsRatesTable
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
      <CustomsRateDetailDrawer
        rate={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        onEdit={handleEdit}
        onToggleStatus={(rate) => setToggleTarget(rate)}
      />

      {/* 5. Modal Form Thêm mới / Sửa */}
      <CustomsRateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rate={selectedEditItem}
        providerOptions={providerOptions}
        officeOptions={officeOptions}
        commodityOptions={commodityOptions}
        onSuccess={loadData}
      />

      {/* 6. Confirm Dialog đổi trạng thái */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={toggleTarget?.status === "ACTIVE" ? "Tạm ngưng biểu phí Hải quan" : "Kích hoạt lại biểu phí Hải quan"}
        description={`Bạn có chắc chắn muốn chuyển trạng thái biểu phí [${toggleTarget?.serviceName} - ${toggleTarget?.customsOfficeName}] sang [${
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
        title="Xóa biểu phí dịch vụ Hải quan"
        description={`Hành động này sẽ xóa vĩnh viễn biểu phí [${deleteTarget?.serviceName} - ${deleteTarget?.customsOfficeName}]. Bạn có chắc chắn muốn thực hiện?`}
        confirmLabel="Xác nhận xóa"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

