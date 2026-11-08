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
  getInsuranceRatesAction,
  getInsurersAction,
  getCommoditiesAction,
  toggleInsuranceRateStatusAction,
  deleteInsuranceRateAction,
} from "@/features/master-data/actions";

import {
  InsuranceRateItem,
  CoverageTypeFilter,
  TransportModeFilter,
  InsuranceRateStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { InsuranceRatesFilterBar } from "./_components/insurance-rates-filter-bar";
import { InsuranceRatesTable } from "./_components/insurance-rates-table";
import { InsuranceRateDetailDrawer } from "./_components/insurance-rate-detail-drawer";
import { InsuranceRateFormDialog } from "./_components/insurance-rate-form-dialog";

export default function InsuranceRatesPage() {
  useDocumentTitle("Biểu phí Bảo hiểm Hàng hóa");

  const [rates, setRates] = useState<InsuranceRateItem[]>([]);
  const [insurerOptions, setInsurerOptions] = useState<{ insurerId: string; insurerName: string }[]>([]);
  const [commodityOptions, setCommodityOptions] = useState<{ id: string; name: string }[]>([]);

  // Drawer, Form & Dialog states
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<InsuranceRateItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<InsuranceRateItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<InsuranceRateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InsuranceRateItem | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCoverage, setSelectedCoverage] = useState<CoverageTypeFilter>("ALL");
  const [selectedInsurer, setSelectedInsurer] = useState("ALL");
  const [selectedTransportMode, setSelectedTransportMode] = useState<TransportModeFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<InsuranceRateStatusFilter>("ALL");

  const { loading, error, runLoad } = useListFeedback("insurance_rates_cache");

  // Nạp dữ liệu
  const loadData = useCallback(() => {
    runLoad(async () => {
      const [rateRes, insRes, comRes] = await Promise.all([
        getInsuranceRatesAction(),
        getInsurersAction(),
        getCommoditiesAction(),
      ]);

      if (rateRes.success && rateRes.data) {
        setRates(rateRes.data);
      } else {
        throw new Error(rateRes.error || "Không thể tải danh sách biểu phí Bảo hiểm.");
      }

      if (insRes.success && insRes.data) {
        setInsurerOptions(insRes.data);
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

  // Danh sách các Đơn vị bảo hiểm phục vụ bộ lọc
  const insurerFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const ins of insurerOptions) {
      map.set(ins.insurerId, ins.insurerName);
    }
    for (const r of rates) {
      if (!map.has(r.insurerId)) {
        map.set(r.insurerId, r.insurerName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [insurerOptions, rates]);

  // Bộ đếm theo Phạm vi bảo hiểm
  const coverageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of rates) {
      counts[item.coverageType] = (counts[item.coverageType] || 0) + 1;
    }
    return counts;
  }, [rates]);

  // Lọc dữ liệu client-side với Accent-Insensitive
  const filteredRates = useMemo(() => {
    return rates.filter((item) => {
      // 1. Lọc theo Phạm vi
      if (selectedCoverage !== "ALL" && item.coverageType !== selectedCoverage) {
        return false;
      }

      // 2. Lọc theo Đơn vị bảo hiểm
      if (selectedInsurer !== "ALL" && item.insurerId !== selectedInsurer) {
        return false;
      }

      // 3. Lọc theo Phương thức vận tải
      if (selectedTransportMode !== "ALL" && item.transportMode !== selectedTransportMode) {
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
          `${item.insurerName} ${item.coverageType} ${item.transportMode} ${item.commodityName} ${item.notes || ""}`
        );
        if (!targetString.includes(cleanSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [rates, selectedCoverage, selectedInsurer, selectedTransportMode, selectedStatus, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCoverage("ALL");
    setSelectedInsurer("ALL");
    setSelectedTransportMode("ALL");
    setSelectedStatus("ALL");
  };

  const handleCreate = () => {
    setSelectedEditItem(null);
    setIsFormOpen(true);
  };

  const handleView = (rate: InsuranceRateItem) => {
    setSelectedDrawerItem(rate);
  };

  const handleEdit = (rate: InsuranceRateItem) => {
    setSelectedDrawerItem(null);
    setSelectedEditItem(rate);
    setIsFormOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await toggleInsuranceRateStatusAction(toggleTarget.rateId, newStatus);
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
      const res = await deleteInsuranceRateAction(deleteTarget.rateId);
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
        title="Biểu phí Bảo hiểm Hàng hóa"
        description="Định mức chi phí bảo hiểm mọi rủi ro (ICC A), tổn thất riêng (ICC B, C) và vận chuyển nội địa cho hàng hóa nông sản, công nghiệp, container liên vận."
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
      <InsuranceRatesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCoverage={selectedCoverage}
        onCoverageChange={setSelectedCoverage}
        selectedInsurer={selectedInsurer}
        onInsurerChange={setSelectedInsurer}
        insurerOptions={insurerFilterOptions}
        selectedTransportMode={selectedTransportMode}
        onTransportModeChange={setSelectedTransportMode}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        coverageCounts={coverageCounts}
        totalCount={rates.length}
        filteredCount={filteredRates.length}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Bảng dữ liệu với loading/error feedback & Empty State */}
      <InsuranceRatesTable
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
      <InsuranceRateDetailDrawer
        rate={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        onEdit={handleEdit}
        onToggleStatus={(rate) => setToggleTarget(rate)}
      />

      {/* 5. Modal Form Thêm mới / Sửa */}
      <InsuranceRateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rate={selectedEditItem}
        insurerOptions={insurerOptions}
        commodityOptions={commodityOptions}
        onSuccess={loadData}
      />

      {/* 6. Confirm Dialog đổi trạng thái */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={toggleTarget?.status === "ACTIVE" ? "Tạm ngưng biểu phí Bảo hiểm" : "Kích hoạt lại biểu phí Bảo hiểm"}
        description={`Bạn có chắc chắn muốn chuyển trạng thái biểu phí [${toggleTarget?.insurerName} - ${toggleTarget?.coverageType}] sang [${
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
        title="Xóa biểu phí Bảo hiểm hàng hóa"
        description={`Hành động này sẽ xóa vĩnh viễn biểu phí [${deleteTarget?.insurerName} - ${deleteTarget?.coverageType}]. Bạn có chắc chắn muốn thực hiện?`}
        confirmLabel="Xác nhận xóa"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

