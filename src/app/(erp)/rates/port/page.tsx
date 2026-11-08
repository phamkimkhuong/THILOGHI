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
  getPortRatesAction,
  togglePortRateStatusAction,
  deletePortRateAction,
} from "@/features/master-data/actions";

import {
  PortRateItem,
  ChargeCodeFilter,
  ContainerTypeFilter,
  PortRateStatusFilter,
  removeVietnameseTones,
} from "./_components/types";
import { PortRatesFilterBar } from "./_components/port-rates-filter-bar";
import { PortRatesTable } from "./_components/port-rates-table";
import { PortRateDetailDrawer } from "./_components/port-rate-detail-drawer";
import { PortRateFormDialog } from "./_components/port-rate-form-dialog";

export default function PortRatesPage() {
  useDocumentTitle("Biểu phí Cảng & Depot Chu Lai");

  const [rates, setRates] = useState<PortRateItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPort, setSelectedPort] = useState("ALL");
  const [selectedChargeCode, setSelectedChargeCode] = useState<ChargeCodeFilter>("ALL");
  const [selectedContainerType, setSelectedContainerType] = useState<ContainerTypeFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<PortRateStatusFilter>("ALL");

  // State Drawer & Form & Confirm Dialog
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<PortRateItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<PortRateItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<PortRateItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortRateItem | null>(null);

  const { loading, error, runLoad } = useListFeedback("port_rates_cache");

  const loadData = useCallback(async () => {
    runLoad(async (isCurrent) => {
      const res = await getPortRatesAction();
      if (!res.success) throw new Error(res.error);
      if (isCurrent()) {
        setRates(res.data);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Danh sách cảng khả dụng
  const portOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rates) {
      if (!map.has(r.portCode)) {
        map.set(r.portCode, r.portName);
      }
    }
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [rates]);

  // Bộ đếm theo từng loại tác nghiệp
  const chargeCodeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of rates) {
      counts[item.chargeCode] = (counts[item.chargeCode] || 0) + 1;
    }
    return counts;
  }, [rates]);

  // Lọc dữ liệu client-side với Accent-Insensitive
  const filteredRates = useMemo(() => {
    return rates.filter((item) => {
      // 0. Lọc theo cảng / depot
      if (selectedPort !== "ALL" && item.portCode !== selectedPort) {
        return false;
      }

      // 1. Lọc theo tác nghiệp
      if (selectedChargeCode !== "ALL" && item.chargeCode !== selectedChargeCode) {
        return false;
      }

      // 2. Lọc theo loại container
      if (selectedContainerType !== "ALL" && item.containerType !== selectedContainerType) {
        return false;
      }

      // 3. Lọc theo trạng thái
      if (selectedStatus === "ACTIVE" && item.status !== "ACTIVE") return false;
      if (selectedStatus === "INACTIVE" && item.status !== "INACTIVE") return false;

      // 4. Tìm kiếm tiếng Việt không dấu
      if (searchTerm.trim()) {
        const normQuery = removeVietnameseTones(searchTerm.trim());
        const normCode = removeVietnameseTones(item.chargeCode);
        const normPort = removeVietnameseTones(item.portName);
        const normCategory = removeVietnameseTones(item.serviceCategory);
        const normCont = removeVietnameseTones(item.containerType);
        const normNotes = removeVietnameseTones(item.notes || "");

        const match =
          normCode.includes(normQuery) ||
          normPort.includes(normQuery) ||
          normCategory.includes(normQuery) ||
          normCont.includes(normQuery) ||
          normNotes.includes(normQuery);

        if (!match) return false;
      }

      return true;
    });
  }, [rates, selectedPort, selectedChargeCode, selectedContainerType, selectedStatus, searchTerm]);

  // Handlers
  const handleToggleStatusConfirm = async () => {
    if (!toggleTarget) return;
    const nextStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const res = await togglePortRateStatusAction(toggleTarget.rateId, nextStatus);
      if (!res.success) {
        toast.error(res.error || "Không thể cập nhật trạng thái");
        return;
      }

      toast.success(res.message);
      setRates((prev) =>
        prev.map((r) =>
          r.rateId === toggleTarget.rateId ? { ...r, status: nextStatus } : r
        )
      );

      // Đồng bộ drawer nếu đang mở
      if (selectedDrawerItem?.rateId === toggleTarget.rateId) {
        setSelectedDrawerItem((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch {
      toast.error("Có lỗi xảy ra khi đổi trạng thái");
    } finally {
      setToggleTarget(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const res = await deletePortRateAction(deleteTarget.rateId);
      if (!res.success) {
        toast.error(res.error || "Không thể xóa biểu phí cảng");
        return;
      }

      toast.success(res.message);
      setRates((prev) => prev.filter((r) => r.rateId !== deleteTarget.rateId));

      if (selectedDrawerItem?.rateId === deleteTarget.rateId) {
        setSelectedDrawerItem(null);
      }
    } catch {
      toast.error("Có lỗi xảy ra khi xóa biểu phí");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedPort("ALL");
    setSelectedChargeCode("ALL");
    setSelectedContainerType("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <div className="space-y-4">
      {/* 1. Header chuẩn ERP */}
      <PageHeader
        title="Biểu phí Cảng & Depot Chu Lai"
        description="Quản lý thư viện đơn giá mua đầu vào cho các tác nghiệp nâng hạ (LO-LO), cắm điện lạnh, THC và lưu bãi tại Cảng Chu Lai."
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onClick={loadData} loading={loading} />
            <Button
              onClick={() => {
                setSelectedEditItem(null);
                setIsFormOpen(true);
              }}
              className="font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm biểu phí
            </Button>
          </div>
        }
      />

      {/* 2. Thanh lọc chuẩn: Tìm kiếm, Loại cont, Trạng thái & Chip Tác nghiệp */}
      <PortRatesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPort={selectedPort}
        onPortChange={setSelectedPort}
        portOptions={portOptions}
        selectedChargeCode={selectedChargeCode}
        onChargeCodeChange={setSelectedChargeCode}
        selectedContainerType={selectedContainerType}
        onContainerTypeChange={setSelectedContainerType}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        chargeCodeCounts={chargeCodeCounts}
        totalCount={rates.length}
        filteredCount={filteredRates.length}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Bảng dữ liệu tự co giãn và cuộn ngang an toàn */}
      <PortRatesTable
        rates={filteredRates}
        loading={loading}
        error={error}
        onRetry={loadData}
        onView={(rate) => setSelectedDrawerItem(rate)}
        onEdit={(rate) => {
          setSelectedEditItem(rate);
          setIsFormOpen(true);
        }}
        onToggleStatus={(rate) => setToggleTarget(rate)}
        onDelete={(rate) => setDeleteTarget(rate)}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Slide-over Drawer xem chi tiết nhanh */}
      <PortRateDetailDrawer
        rate={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        onEdit={(rate) => {
          setSelectedDrawerItem(null);
          setSelectedEditItem(rate);
          setIsFormOpen(true);
        }}
        onToggleStatus={(rate) => setToggleTarget(rate)}
      />

      {/* 5. Modal Dialog Tạo / Chỉnh sửa */}
      <PortRateFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedEditItem(null);
        }}
        rate={selectedEditItem}
        onSuccess={loadData}
      />

      {/* 6. Confirm Dialog: Kích hoạt / Tạm dừng */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null);
        }}
        title={
          toggleTarget?.status === "ACTIVE"
            ? "Tạm dừng áp dụng biểu phí?"
            : "Kích hoạt áp dụng biểu phí?"
        }
        description={
          toggleTarget
            ? `Bạn có chắc muốn ${
                toggleTarget.status === "ACTIVE" ? "tạm dừng" : "kích hoạt"
              } biểu phí [${toggleTarget.chargeCode} - ${toggleTarget.containerType}] tại ${toggleTarget.portName}?`
            : ""
        }
        confirmLabel={
          toggleTarget?.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"
        }
        variant={toggleTarget?.status === "ACTIVE" ? "destructive" : "primary"}
        onConfirm={handleToggleStatusConfirm}
      />

      {/* 7. Confirm Dialog: Xóa biểu phí */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xác nhận xóa biểu phí cảng?"
        description={
          deleteTarget
            ? `Hành động này sẽ xóa vĩnh viễn biểu phí [${deleteTarget.chargeCode} - ${deleteTarget.containerType}] khỏi thư viện giá mua.`
            : ""
        }
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
