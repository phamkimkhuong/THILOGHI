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
  getOtherRatesAction,
  getOtherProvidersAction,
  toggleOtherRateStatusAction,
  deleteOtherRateAction,
} from "@/features/master-data/actions";

import {
  OtherRateItem,
  ServiceCodeFilter,
  PricingMethodFilter,
  OtherRateStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { OtherRatesFilterBar } from "./_components/other-rates-filter-bar";
import { OtherRatesTable } from "./_components/other-rates-table";
import { OtherRateDetailDrawer } from "./_components/other-rate-detail-drawer";
import { OtherRateFormDialog } from "./_components/other-rate-form-dialog";

export default function OtherRatesPage() {
  useDocumentTitle("Biểu phí Dịch vụ Khác có kiểm soát");

  const [rates, setRates] = useState<OtherRateItem[]>([]);
  const [providerOptions, setProviderOptions] = useState<{ providerId: string; providerName: string }[]>([]);

  // Drawer, Form & Dialog states
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<OtherRateItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<OtherRateItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<OtherRateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OtherRateItem | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCode, setSelectedCode] = useState<ServiceCodeFilter>("ALL");
  const [selectedProvider, setSelectedProvider] = useState("ALL");
  const [selectedPricingMethod, setSelectedPricingMethod] = useState<PricingMethodFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<OtherRateStatusFilter>("ALL");

  const { loading, error, runLoad } = useListFeedback("other_rates_cache");

  // Nạp dữ liệu
  const loadData = useCallback(() => {
    runLoad(async () => {
      const [rateRes, provRes] = await Promise.all([
        getOtherRatesAction(),
        getOtherProvidersAction(),
      ]);

      if (rateRes.success && rateRes.data) {
        setRates(rateRes.data);
      } else {
        throw new Error(rateRes.error || "Không thể tải danh sách biểu phí Dịch vụ khác.");
      }

      if (provRes.success && provRes.data) {
        setProviderOptions(provRes.data);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Danh sách các Nhà cung cấp phục vụ bộ lọc
  const providerFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const prov of providerOptions) {
      map.set(prov.providerId, prov.providerName);
    }
    for (const r of rates) {
      if (!map.has(r.providerId)) {
        map.set(r.providerId, r.providerName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [providerOptions, rates]);

  // Bộ đếm theo Mã dịch vụ
  const codeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of rates) {
      counts[item.serviceCode] = (counts[item.serviceCode] || 0) + 1;
    }
    return counts;
  }, [rates]);

  // Lọc dữ liệu client-side với Accent-Insensitive
  const filteredRates = useMemo(() => {
    return rates.filter((item) => {
      // 1. Lọc theo Mã dịch vụ
      if (selectedCode !== "ALL" && item.serviceCode !== selectedCode) {
        return false;
      }

      // 2. Lọc theo Đơn vị cung cấp
      if (selectedProvider !== "ALL" && item.providerId !== selectedProvider) {
        return false;
      }

      // 3. Lọc theo Phương pháp định giá
      if (selectedPricingMethod !== "ALL" && item.pricingMethod !== selectedPricingMethod) {
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
          `${item.serviceCode} ${item.serviceName} ${item.providerName} ${item.notes || ""}`
        );
        if (!targetString.includes(cleanSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [rates, selectedCode, selectedProvider, selectedPricingMethod, selectedStatus, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCode("ALL");
    setSelectedProvider("ALL");
    setSelectedPricingMethod("ALL");
    setSelectedStatus("ALL");
  };

  const handleCreate = () => {
    setSelectedEditItem(null);
    setIsFormOpen(true);
  };

  const handleView = (rate: OtherRateItem) => {
    setSelectedDrawerItem(rate);
  };

  const handleEdit = (rate: OtherRateItem) => {
    setSelectedDrawerItem(null);
    setSelectedEditItem(rate);
    setIsFormOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await toggleOtherRateStatusAction(toggleTarget.rateId, newStatus);
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
      const res = await deleteOtherRateAction(deleteTarget.rateId);
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
        title="Biểu phí Dịch vụ Khác có kiểm soát"
        description="Định mức chi phí các nghiệp vụ bổ sung (giám định hàng hóa, xe hoa tiêu hộ tống, chuyển giao chứng từ, thiết bị chuyên dụng) theo quy chuẩn THILOGI."
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
      <OtherRatesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCode={selectedCode}
        onCodeChange={setSelectedCode}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        providerOptions={providerFilterOptions}
        selectedPricingMethod={selectedPricingMethod}
        onPricingMethodChange={setSelectedPricingMethod}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        codeCounts={codeCounts}
        totalCount={rates.length}
        filteredCount={filteredRates.length}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Bảng dữ liệu với loading/error feedback & Empty State */}
      <OtherRatesTable
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
      <OtherRateDetailDrawer
        rate={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        onEdit={handleEdit}
        onToggleStatus={(rate) => setToggleTarget(rate)}
      />

      {/* 5. Modal Form Thêm mới / Sửa */}
      <OtherRateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rate={selectedEditItem}
        providerOptions={providerOptions}
        onSuccess={loadData}
      />

      {/* 6. Confirm Dialog đổi trạng thái */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={toggleTarget?.status === "ACTIVE" ? "Tạm ngưng biểu phí Dịch vụ khác" : "Kích hoạt lại biểu phí"}
        description={`Bạn có chắc chắn muốn chuyển trạng thái biểu phí [${toggleTarget?.serviceName}] sang [${
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
        title="Xóa biểu phí Dịch vụ khác"
        description={`Hành động này sẽ xóa vĩnh viễn biểu phí [${deleteTarget?.serviceName}]. Bạn có chắc chắn muốn thực hiện?`}
        confirmLabel="Xác nhận xóa"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

