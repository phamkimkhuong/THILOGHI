"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { FileSpreadsheet, FileUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, RefreshButton, useListFeedback } from "@/components/ui/list-page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import {
  getRoadRatesAction,
  getRoadRateOptionsAction,
  toggleRoadRateStatusAction,
  deleteRoadRateAction,
} from "@/features/master-data/actions";
import { exportRoadRatesToExcel } from "@/shared/utils/excel";

import { RatesRouteMatcher } from "./_components/rates-route-matcher";
import { RatesFilterBar } from "./_components/rates-filter-bar";
import { RatesTable } from "./_components/rates-table";
import { RatesImportDialog } from "./_components/rates-import-dialog";
import { RatesDetailDrawer } from "./_components/rates-detail-drawer";
import { RatesFormDialog } from "./_components/rates-form-dialog";
import type { RoadRateItem, RoadRateSortOption, OptionItem } from "./_components/types";

export default function RoadRatesLibraryPage() {
  useDocumentTitle("Giá mua đường bộ");

  // Server State
  const [rates, setRates] = useState<RoadRateItem[]>([]);
  const [vendors, setVendors] = useState<OptionItem[]>([]);
  const [locations, setLocations] = useState<OptionItem[]>([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("ALL");
  const [sortBy, setSortBy] = useState<RoadRateSortOption>("route");

  // Quick Route Matcher State
  const [matcherOrigin, setMatcherOrigin] = useState("ALL");
  const [matcherDest, setMatcherDest] = useState("ALL");
  const [matcherEquipment, setMatcherEquipment] = useState("ALL");

  // Dialog & Drawer States
  const [importOpen, setImportOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<RoadRateItem | null>(null);
  const [selectedDetailRate, setSelectedDetailRate] = useState<RoadRateItem | null>(null);

  // Confirm Actions States
  const [toggleTarget, setToggleTarget] = useState<RoadRateItem | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoadRateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { loading, error: loadError, runLoad } = useListFeedback("road_rates_list");

  // Nạp dữ liệu bảng giá & danh mục hỗ trợ từ Server Actions
  const loadRates = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const [res, optRes] = await Promise.all([
        getRoadRatesAction(),
        getRoadRateOptionsAction(),
      ]);
      if (!res.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      if (res.success && res.data) {
        setRates(res.data as RoadRateItem[]);
      }
      if (optRes.success && optRes.vendors && optRes.locations) {
        setVendors(optRes.vendors);
        setLocations(optRes.locations);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Thao tác xem chi tiết
  const handleView = (rate: RoadRateItem) => {
    setSelectedDetailRate(rate);
  };

  // Thao tác mở form tạo mới
  const handleCreate = () => {
    setEditingRate(null);
    setIsFormOpen(true);
  };

  // Thao tác mở form chỉnh sửa
  const handleEdit = (rate: RoadRateItem) => {
    setEditingRate(rate);
    setIsFormOpen(true);
    setSelectedDetailRate(null);
  };

  // Thao tác mở dialog đổi trạng thái
  const handleToggle = (rate: RoadRateItem) => {
    setToggleTarget(rate);
  };

  // Thực hiện đổi trạng thái (ACTIVE <-> RETIRED)
  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setIsToggling(true);
    try {
      const res = await toggleRoadRateStatusAction(toggleTarget.rateId);
      if (!res.success) throw new Error(res.error || "Không thể cập nhật trạng thái");
      toast.success(res.message || "Đã cập nhật trạng thái biểu cước!");
      setToggleTarget(null);
      loadRates();
      if (selectedDetailRate?.rateId === toggleTarget.rateId) {
        setSelectedDetailRate(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái");
    } finally {
      setIsToggling(false);
    }
  };

  // Thao tác mở dialog xóa
  const handleDelete = (rate: RoadRateItem) => {
    setDeleteTarget(rate);
  };

  // Thực hiện xóa biểu cước
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteRoadRateAction(deleteTarget.rateId);
      if (!res.success) throw new Error(res.error || "Không thể xóa biểu cước");
      toast.success(res.message || "Đã xóa biểu cước thành công!");
      setDeleteTarget(null);
      loadRates();
      if (selectedDetailRate?.rateId === deleteTarget.rateId) {
        setSelectedDetailRate(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi xóa biểu cước");
    } finally {
      setIsDeleting(false);
    }
  };

  // Danh sách các điểm xếp, điểm dỡ, thiết bị duy nhất
  const uniqueOrigins = useMemo(() => {
    const map = new Map<string, string>();
    rates.forEach((r) => map.set(r.pickupLocationId, `${r.pickupName} (${r.pickupCode})`));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rates]);

  const uniqueDestinations = useMemo(() => {
    const map = new Map<string, string>();
    rates.forEach((r) => map.set(r.deliveryLocationId, `${r.deliveryName} (${r.deliveryCode})`));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rates]);

  const uniqueEquipments = useMemo(() => {
    const set = new Set<string>();
    rates.forEach((r) => set.add(r.equipmentType));
    return Array.from(set).sort();
  }, [rates]);

  // Bộ lọc thông minh phản hồi tức thì
  const filteredRates = useMemo(() => {
    let list = [...rates];

    // Tìm kiếm tức thì theo từ khóa
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.vendorName.toLowerCase().includes(q) ||
          r.pickupName.toLowerCase().includes(q) ||
          r.deliveryName.toLowerCase().includes(q) ||
          r.pickupCode.toLowerCase().includes(q) ||
          r.deliveryCode.toLowerCase().includes(q) ||
          r.equipmentType.toLowerCase().includes(q)
      );
    }

    // Lọc theo chip thiết bị
    if (selectedEquipment !== "ALL") {
      list = list.filter((r) => r.equipmentType === selectedEquipment);
    }

    // Lọc theo bộ ghép tuyến nhanh
    if (matcherOrigin !== "ALL") {
      list = list.filter((r) => r.pickupLocationId === matcherOrigin);
    }
    if (matcherDest !== "ALL") {
      list = list.filter((r) => r.deliveryLocationId === matcherDest);
    }
    if (matcherEquipment !== "ALL") {
      list = list.filter((r) => r.equipmentType === matcherEquipment);
    }

    // Sắp xếp
    if (sortBy === "price_asc") {
      list.sort((a, b) => a.currency.localeCompare(b.currency) || a.buyRate - b.buyRate);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => a.currency.localeCompare(b.currency) || b.buyRate - a.buyRate);
    } else if (sortBy === "route") {
      list.sort((a, b) => a.pickupName.localeCompare(b.pickupName));
    }

    return list;
  }, [rates, searchTerm, selectedEquipment, matcherOrigin, matcherDest, matcherEquipment, sortBy]);

  const resetMatcherFilters = () => {
    setMatcherOrigin("ALL");
    setMatcherDest("ALL");
    setMatcherEquipment("ALL");
  };

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* 1. Header Trang & Thao tác Quản trị */}
      <PageHeader
        title="Giá mua đường bộ"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCreate}
              className="flex items-center gap-1.5 shadow-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm biểu cước
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void exportRoadRatesToExcel(filteredRates)}
              className="flex items-center gap-1.5 shadow-xs font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Xuất Excel
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 shadow-xs font-semibold"
            >
              <FileUp className="w-3.5 h-3.5 text-blue-600" /> Nhập Excel
            </Button>

            <RefreshButton onClick={loadRates} loading={loading} />
          </div>
        }
      />

      {/* 2. Khối Lọc Tuyến Cước Nhanh */}
      <RatesRouteMatcher
        origin={matcherOrigin}
        onOriginChange={setMatcherOrigin}
        dest={matcherDest}
        onDestChange={setMatcherDest}
        equipment={matcherEquipment}
        onEquipmentChange={setMatcherEquipment}
        uniqueOrigins={uniqueOrigins}
        uniqueDestinations={uniqueDestinations}
        uniqueEquipments={uniqueEquipments}
        onReset={resetMatcherFilters}
      />

      {/* 3. Thanh Lọc Đa Chiều: Tìm kiếm, Dải chip thiết bị, Sắp xếp */}
      <RatesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedEquipment={selectedEquipment}
        onEquipmentChange={setSelectedEquipment}
        uniqueEquipments={uniqueEquipments}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        totalCount={rates.length}
        filteredCount={filteredRates.length}
      />

      {/* 4. Bảng Dữ Liệu Biểu Cước Đường Bộ Chuẩn THILOGI */}
      <RatesTable
        rates={filteredRates}
        loading={loading}
        loadError={loadError}
        onRetry={loadRates}
        filterKey={JSON.stringify([
          searchTerm,
          selectedEquipment,
          matcherOrigin,
          matcherDest,
          matcherEquipment,
          sortBy,
        ])}
        totalOriginal={rates.length}
        onView={handleView}
        onEdit={handleEdit}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />

      {/* 5. Ngăn Kéo Slide-over Chi Tiết Biểu Cước */}
      <RatesDetailDrawer
        rate={selectedDetailRate}
        onClose={() => setSelectedDetailRate(null)}
        onEdit={handleEdit}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />

      {/* 6. Modal Form Thêm Mới / Sửa Biểu Cước */}
      <RatesFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingRate}
        vendors={vendors}
        locations={locations}
        onSuccess={() => {
          loadRates();
        }}
      />

      {/* 7. Modal Nhập Biểu Cước Excel Hàng Loạt */}
      <RatesImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={loadRates}
      />

      {/* 8. Hộp thoại Xác nhận Đổi Trạng Thái Biểu Cước */}
      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={
          toggleTarget?.status === "APPROVED" || toggleTarget?.status === "Active"
            ? "Ngừng áp dụng biểu cước?"
            : "Kích hoạt lại biểu cước?"
        }
        description={
          toggleTarget ? (
            <span>
              Bạn có chắc muốn chuyển trạng thái biểu cước tuyến{" "}
              <strong>
                {toggleTarget.pickupName} &rarr; {toggleTarget.deliveryName}
              </strong>{" "}
              ({toggleTarget.equipmentType}) của nhà xe <strong>{toggleTarget.vendorName}</strong> thành{" "}
              <strong>
                {toggleTarget.status === "APPROVED" || toggleTarget.status === "Active"
                  ? "RETIRED (Ngừng áp dụng)"
                  : "APPROVED (Áp dụng)"}
              </strong>
              ?
            </span>
          ) : ""
        }
        confirmLabel={
          toggleTarget?.status === "APPROVED" || toggleTarget?.status === "Active"
            ? "Ngừng áp dụng"
            : "Kích hoạt"
        }
        variant={
          toggleTarget?.status === "APPROVED" || toggleTarget?.status === "Active"
            ? "destructive"
            : "primary"
        }
        loading={isToggling}
        onConfirm={handleConfirmToggle}
      />

      {/* 9. Hộp thoại Xác nhận Xóa Biểu Cước */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xác nhận xóa biểu cước mua đường bộ"
        description={
          deleteTarget ? (
            <span>
              Hành động này sẽ xóa hoàn toàn biểu cước tuyến{" "}
              <strong>
                {deleteTarget.pickupName} &rarr; {deleteTarget.deliveryName}
              </strong>{" "}
              ({deleteTarget.equipmentType}) của nhà xe <strong>{deleteTarget.vendorName}</strong>. Biểu cước đã phát sinh trong các hồ sơ báo giá sẽ được bảo vệ toàn vẹn không thể xóa.
            </span>
          ) : ""
        }
        confirmLabel="Xóa vĩnh viễn"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
