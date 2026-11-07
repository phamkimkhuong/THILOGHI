"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, RefreshButton, useListFeedback } from "@/components/ui/list-page";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import {
  getLocationsAction,
  toggleLocationStatusAction,
  deleteLocationAction,
} from "@/features/master-data/actions";

import { LocationFilterBar } from "./_components/location-filter-bar";
import { LocationTable } from "./_components/location-table";
import { LocationDetailDrawer } from "./_components/location-detail-drawer";
import { LocationFormDialog } from "./_components/location-form-dialog";
import { removeVietnameseTones, type LocationRecord, type RegionRecord } from "./_components/types";

export default function MasterLocationsPage() {
  useDocumentTitle("Quản lý Địa điểm");

  // Server Data State
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [regions, setRegions] = useState<RegionRecord[]>([]);

  // Filter States
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // UI Modal / Drawer States
  const [selectedLocation, setSelectedLocation] = useState<LocationRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationRecord | null>(null);

  // Dialog Confirm States
  const [deleteTarget, setDeleteTarget] = useState<LocationRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<LocationRecord | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const { loading, error: loadError, runLoad } = useListFeedback("locations_list");

  // Nạp dữ liệu từ Server Actions (RAM Cache SWR)
  const loadData = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const res = await getLocationsAction();
      if (!res.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      if (res.success) {
        setLocations((res.locations || []) as LocationRecord[]);
        setRegions((res.regions || []) as RegionRecord[]);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Thống kê phân bố theo Quốc gia cho bộ lọc
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    locations.forEach((l) => {
      const c = l.countryCode?.toUpperCase() || "OTHER";
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [locations]);

  // Thống kê phân bố theo Loại hình cho bộ lọc
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    locations.forEach((l) => {
      counts[l.locationType] = (counts[l.locationType] || 0) + 1;
    });
    return counts;
  }, [locations]);

  // Lọc thông minh tức thì (Tìm kiếm tiếng Việt có dấu & không dấu)
  const filteredLocations = useMemo(() => {
    let list = [...locations];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const qNorm = removeVietnameseTones(q);

      list = list.filter((l) => {
        const fields = [
          l.name,
          l.code,
          l.address,
          l.province,
          l.company,
          l.contact,
          l.note,
          l.commodities,
          l.countryCode,
          l.regionName,
          l.regionId,
        ].filter(Boolean) as string[];

        return fields.some((f) => {
          const lower = f.toLowerCase();
          return lower.includes(q) || removeVietnameseTones(lower).includes(qNorm);
        });
      });
    }

    if (countryFilter !== "ALL") {
      list = list.filter((l) => (l.countryCode || "").toUpperCase() === countryFilter);
    }

    if (regionFilter !== "ALL") {
      list = list.filter((l) => l.regionId === regionFilter);
    }

    if (typeFilter !== "ALL") {
      list = list.filter((l) => l.locationType === typeFilter);
    }

    return list;
  }, [locations, searchTerm, countryFilter, regionFilter, typeFilter]);

  // Nhận diện kết quả ở phân vùng khác khi bộ lọc hiện tại cho kết quả rỗng
  const crossRegionMatches = useMemo(() => {
    if (!searchTerm.trim() || regionFilter === "ALL") return [];
    const qNorm = removeVietnameseTones(searchTerm.toLowerCase().trim());
    return locations.filter((l) => {
      const fields = [
        l.name,
        l.code,
        l.address,
        l.province,
        l.company,
        l.contact,
        l.note,
        l.commodities,
        l.countryCode,
      ].filter(Boolean) as string[];
      return fields.some((f) => removeVietnameseTones(f.toLowerCase()).includes(qNorm));
    });
  }, [locations, searchTerm, regionFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setCountryFilter("ALL");
    setTypeFilter("ALL");
    setRegionFilter("ALL");
  };

  // Mở modal Thêm mới / Chỉnh sửa
  const handleOpenCreate = () => {
    setEditingLocation(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (loc: LocationRecord) => {
    setEditingLocation(loc);
    setIsFormOpen(true);
  };

  // Xóa địa điểm
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await deleteLocationAction(deleteTarget.locationId);
      if (!res.success) throw new Error(res.error || "Không thể xóa địa điểm.");
      toast.success(res.message || `Đã xóa địa điểm [${deleteTarget.name}].`);
      if (selectedLocation?.locationId === deleteTarget.locationId) {
        setSelectedLocation(null);
      }
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi xóa địa điểm.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Đổi trạng thái hoạt động
  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true);
    try {
      const res = await toggleLocationStatusAction(toggleTarget.locationId);
      if (!res.success) throw new Error(res.error || "Không thể đổi trạng thái.");
      toast.success(res.message || "Đã cập nhật trạng thái thành công!");
      if (selectedLocation?.locationId === toggleTarget.locationId) {
        setSelectedLocation({
          ...selectedLocation,
          isActive: res.isActive ?? !selectedLocation.isActive,
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
      {/* 1. Header Trang & Nút Tác vụ Chính */}
      <PageHeader
        title="Quản lý Địa điểm"
        description="Danh mục các bãi đóng hàng, kho bãi, cảng biển và cửa khẩu phục vụ vận tải đường bộ và biển."
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Thêm địa điểm
            </Button>
            <RefreshButton onClick={loadData} loading={loading} />
          </>
        }
      />

      {/* 2. Thanh Bộ Lọc Đa Chiều & Tìm Kiếm Không Dấu */}
      <LocationFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        countryFilter={countryFilter}
        onCountryFilterChange={setCountryFilter}
        countryCounts={countryCounts}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        typeCounts={typeCounts}
        regionFilter={regionFilter}
        onRegionFilterChange={setRegionFilter}
        regions={regions}
        totalLocations={locations.length}
        crossRegionMatches={crossRegionMatches}
        onResetFilters={resetFilters}
      />

      {/* 3. Bảng Dữ Liệu & Phân Trang */}
      <LocationTable
        locations={filteredLocations}
        loading={loading}
        loadError={loadError}
        onRetry={loadData}
        onView={setSelectedLocation}
        onEdit={handleOpenEdit}
        onToggle={setToggleTarget}
        onDelete={setDeleteTarget}
        filterKey={JSON.stringify([searchTerm, countryFilter, regionFilter, typeFilter])}
        totalOriginal={locations.length}
        searchTerm={searchTerm}
        regionFilter={regionFilter}
        regions={regions}
        crossRegionMatches={crossRegionMatches}
        onResetFilters={resetFilters}
      />

      {/* 4. Slide-over Drawer Xem Chi Tiết Bản Đồ & Hồ Sơ GPS */}
      <LocationDetailDrawer
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onEdit={handleOpenEdit}
        onToggle={setToggleTarget}
        onDelete={setDeleteTarget}
      />

      {/* 5. Modal Form Thêm Mới & Chỉnh Sửa Địa Điểm */}
      <LocationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingLocation}
        regions={regions}
        onSuccess={() => {
          loadData();
          if (selectedLocation && editingLocation?.locationId === selectedLocation.locationId) {
            setSelectedLocation(null);
          }
        }}
      />

      {/* 6. Hộp Thoại Xác Nhận Xóa Địa Điểm (Kiểm tra Foreign Key) */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        variant="destructive"
        title="Xác nhận xóa địa điểm"
        description={
          deleteTarget ? (
            <span>
              Bạn có chắc chắn muốn xóa vĩnh viễn địa điểm{" "}
              <strong className="text-foreground">[{deleteTarget.code}] {deleteTarget.name}</strong> khỏi hệ thống?
              <br />
              <span className="text-[11px] text-amber-600 mt-1 block">
                Lưu ý: Nếu địa điểm đã được sử dụng trong Bảng giá hoặc Đơn hàng, hệ thống sẽ chặn xóa để bảo toàn lịch sử và đề xuất tạm dừng hoạt động.
              </span>
            </span>
          ) : (
            ""
          )
        }
        confirmLabel="Xóa địa điểm"
        cancelLabel="Hủy"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />

      {/* 7. Hộp Thoại Xác Nhận Đổi Trạng Thái (Kích hoạt / Tạm dừng) */}
      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null);
        }}
        variant={toggleTarget?.isActive ? "destructive" : "primary"}
        title={toggleTarget?.isActive ? "Tạm dừng hoạt động địa điểm" : "Kích hoạt lại địa điểm"}
        description={
          toggleTarget ? (
            <span>
              Bạn có chắc muốn{" "}
              {toggleTarget.isActive ? "tạm dừng hoạt động" : "kích hoạt lại"} địa điểm{" "}
              <strong className="text-foreground">[{toggleTarget.code}] {toggleTarget.name}</strong>?
            </span>
          ) : (
            ""
          )
        }
        confirmLabel={toggleTarget?.isActive ? "Tạm dừng" : "Kích hoạt"}
        cancelLabel="Hủy"
        loading={toggleLoading}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
