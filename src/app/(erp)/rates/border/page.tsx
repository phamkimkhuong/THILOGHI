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
  getBorderRatesAction,
  toggleBorderRateStatusAction,
  deleteBorderRateAction,
} from "@/features/master-data/actions";

import {
  BorderRateItem,
  CountryPairFilter,
  BorderRateStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { BorderRatesFilterBar } from "./_components/border-rates-filter-bar";
import { BorderRatesTable } from "./_components/border-rates-table";
import { BorderRateDetailDrawer } from "./_components/border-rate-detail-drawer";
import { BorderRateFormDialog } from "./_components/border-rate-form-dialog";

export default function BorderRatesPage() {
  useDocumentTitle("Biểu phí Cửa khẩu & Bãi kiểm hóa");

  const [rates, setRates] = useState<BorderRateItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountryPair, setSelectedCountryPair] = useState<CountryPairFilter>("ALL");
  const [selectedBorderPair, setSelectedBorderPair] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<BorderRateStatusFilter>("ALL");

  // State Drawer & Form & Confirm Dialog
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<BorderRateItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<BorderRateItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<BorderRateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BorderRateItem | null>(null);

  const { loading, error, runLoad } = useListFeedback("border_rates_cache");

  const loadData = useCallback(async () => {
    runLoad(async (isCurrent) => {
      const res = await getBorderRatesAction();
      if (!res.success) throw new Error(res.error);
      if (isCurrent()) {
        setRates(res.data);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Danh sách các cặp cửa khẩu có trong dữ liệu
  const borderPairOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rates) {
      if (!map.has(r.borderPairId)) {
        map.set(r.borderPairId, `${r.borderPairName} (${r.borderPairId})`);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rates]);

  // Bộ đếm theo Tuyến Quốc gia
  const countryPairCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of rates) {
      counts[item.countryPair] = (counts[item.countryPair] || 0) + 1;
    }
    return counts;
  }, [rates]);

  // Lọc dữ liệu client-side với Accent-Insensitive
  const filteredRates = useMemo(() => {
    return rates.filter((item) => {
      // 1. Lọc theo Tuyến Quốc gia
      if (selectedCountryPair !== "ALL" && item.countryPair !== selectedCountryPair) {
        return false;
      }

      // 2. Lọc theo Cặp Cửa khẩu
      if (selectedBorderPair !== "ALL" && item.borderPairId !== selectedBorderPair) {
        return false;
      }

      // 3. Lọc theo Trạng thái
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) {
        return false;
      }

      // 4. Tìm kiếm từ khóa (accent-insensitive)
      if (searchTerm.trim()) {
        const query = removeVietnameseTones(searchTerm.trim());
        const targetStr = removeVietnameseTones(
          `${item.borderPairId} ${item.borderPairName} ${item.countryPair} ${item.provinces} ${item.commodityName} ${item.notes}`
        );
        if (!targetStr.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [rates, selectedCountryPair, selectedBorderPair, selectedStatus, searchTerm]);

  // Xóa toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCountryPair("ALL");
    setSelectedBorderPair("ALL");
    setSelectedStatus("ALL");
  };

  // Mở form tạo mới
  const handleCreate = () => {
    setSelectedEditItem(null);
    setIsFormOpen(true);
  };

  // Mở form chỉnh sửa
  const handleEdit = (rate: BorderRateItem) => {
    setSelectedDrawerItem(null);
    setSelectedEditItem(rate);
    setIsFormOpen(true);
  };

  // Xem chi tiết qua Drawer
  const handleView = (rate: BorderRateItem) => {
    setSelectedDrawerItem(rate);
  };

  // Xử lý đổi trạng thái
  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const nextStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await toggleBorderRateStatusAction(toggleTarget.rateId, nextStatus);
      if (res.success) {
        toast.success(res.message);
        setRates((prev) =>
          prev.map((r) =>
            r.rateId === toggleTarget.rateId ? { ...r, status: nextStatus } : r
          )
        );
        if (selectedDrawerItem?.rateId === toggleTarget.rateId) {
          setSelectedDrawerItem((prev) => (prev ? { ...prev, status: nextStatus } : null));
        }
      } else {
        toast.error(res.error || "Không thể cập nhật trạng thái.");
      }
    } catch {
      toast.error("Lỗi khi kết nối đến máy chủ.");
    } finally {
      setToggleTarget(null);
    }
  };

  // Xử lý xóa
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteBorderRateAction(deleteTarget.rateId);
      if (res.success) {
        toast.success(res.message);
        setRates((prev) => prev.filter((r) => r.rateId !== deleteTarget.rateId));
        if (selectedDrawerItem?.rateId === deleteTarget.rateId) {
          setSelectedDrawerItem(null);
        }
      } else {
        toast.error(res.error || "Không thể xóa biểu phí cửa khẩu.");
      }
    } catch {
      toast.error("Lỗi khi kết nối đến máy chủ.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header trang chuẩn Thilogi ERP */}
      <PageHeader
        title="Biểu phí Cửa khẩu & Bãi kiểm hóa"
        description="Định mức chi phí hạ tầng (CSHT), phí ra vào bãi kiểm hóa và lệ phí tờ khai cho các tuyến liên vận Việt - Lào và Việt - Campuchia."
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

      {/* Thanh lọc & tìm kiếm */}
      <BorderRatesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCountryPair={selectedCountryPair}
        onCountryPairChange={setSelectedCountryPair}
        selectedBorderPair={selectedBorderPair}
        onBorderPairChange={setSelectedBorderPair}
        borderPairOptions={borderPairOptions}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        countryPairCounts={countryPairCounts}
        totalCount={rates.length}
        filteredCount={filteredRates.length}
        onResetFilters={handleResetFilters}
      />

      {/* Bảng dữ liệu với loading/error feedback */}
      <TableFeedback
        columns={12}
        loading={loading}
        error={error}
        onRetry={loadData}
      />

      {!loading && !error && (
        <BorderRatesTable
          rates={filteredRates}
          onView={handleView}
          onEdit={handleEdit}
          onToggleStatus={(rate) => setToggleTarget(rate)}
          onDelete={(rate) => setDeleteTarget(rate)}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Drawer xem chi tiết */}
      <BorderRateDetailDrawer
        rate={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        onEdit={handleEdit}
        onToggleStatus={(rate) => setToggleTarget(rate)}
      />

      {/* Dialog thêm mới / chỉnh sửa */}
      <BorderRateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rate={selectedEditItem}
        onSuccess={loadData}
      />

      {/* Confirm Dialog đổi trạng thái */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title="Xác nhận thay đổi trạng thái"
        description={`Bạn có chắc chắn muốn ${
          toggleTarget?.status === "ACTIVE" ? "tạm dừng" : "kích hoạt"
        } biểu phí [${toggleTarget?.borderPairName} - ${toggleTarget?.commodityName}]?`}
        confirmLabel={toggleTarget?.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}
        variant="primary"
        onConfirm={handleConfirmToggle}
      />

      {/* Confirm Dialog xóa biểu phí */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xác nhận xóa biểu phí cửa khẩu"
        description={`Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa biểu phí [${deleteTarget?.borderPairName} - ${deleteTarget?.commodityName}]?`}
        confirmLabel="Xóa biểu phí"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

