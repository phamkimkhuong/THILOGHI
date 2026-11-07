"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { PageHeader, RefreshButton, useListFeedback } from "@/components/ui/list-page";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { getFleetAction } from "@/features/master-data/actions";

import {
  TractorFleetItem,
  TrailerFleetItem,
  DriverFleetItem,
  FleetActiveTab,
  SelectedFleetItem,
  isInternalThilotrans,
  removeVietnameseTones,
} from "./_components/types";
import { FleetFilterBar } from "./_components/fleet-filter-bar";
import { TractorsTable } from "./_components/tractors-table";
import { TrailersTable } from "./_components/trailers-table";
import { DriversTable } from "./_components/drivers-table";
import { FleetDetailDrawer } from "./_components/fleet-detail-drawer";

export default function MasterFleetPage() {
  useDocumentTitle("Đội xe & Tài xế");

  // State quản lý tab & dữ liệu
  const [activeTab, setActiveTab] = useState<FleetActiveTab>("TRACTORS");
  const [tractors, setTractors] = useState<TractorFleetItem[]>([]);
  const [trailers, setTrailers] = useState<TrailerFleetItem[]>([]);
  const [drivers, setDrivers] = useState<DriverFleetItem[]>([]);

  // State bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwnership, setSelectedOwnership] = useState<
    "ALL" | "INTERNAL" | "SUBCONTRACTOR"
  >("ALL");
  const [subFilter, setSubFilter] = useState("ALL");

  // State Drawer xem chi tiết hồ sơ
  const [selectedDrawerItem, setSelectedDrawerItem] =
    useState<SelectedFleetItem>(null);

  const { loading, error: loadError, runLoad } = useListFeedback("fleet_list");

  // Tải danh mục đội xe từ Server Action
  const loadData = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const res = await getFleetAction(1500);
      if (!res.success) throw new Error(res.error || "Load failed");
      if (!isCurrent()) return;
      if (res.success && res.fleet) {
        setTractors(res.fleet.tractors || []);
        setTrailers(res.fleet.trailers || []);
        setDrivers(res.fleet.drivers || []);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chuyển tab và reset sub-filter
  const handleTabChange = (tab: FleetActiveTab) => {
    setActiveTab(tab);
    setSubFilter("ALL");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedOwnership("ALL");
    setSubFilter("ALL");
  };

  // 1. Danh sách options cho bộ lọc phụ tùy theo Tab đang chọn
  const { subFilterOptions, subFilterLabel } = useMemo(() => {
    if (activeTab === "TRACTORS") {
      const counts: Record<string, number> = {};
      tractors.forEach((t) => {
        const r = t.transitRoute || "Unknown";
        if (r !== "Unknown" && r !== "Wait") {
          counts[r] = (counts[r] || 0) + 1;
        }
      });
      const options = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([k, v]) => ({ value: k, label: k, count: v }));
      return { subFilterOptions: options, subFilterLabel: "Tuyến liên vận" };
    }

    if (activeTab === "TRAILERS") {
      const counts: Record<string, number> = {};
      trailers.forEach((tr) => {
        const m = tr.modelType || "Unknown";
        if (m !== "Unknown") {
          counts[m] = (counts[m] || 0) + 1;
        }
      });
      const options = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([k, v]) => ({ value: k, label: k, count: v }));
      return { subFilterOptions: options, subFilterLabel: "Chủng loại moóc" };
    }

    // DRIVERS
    const counts: Record<string, number> = {};
    drivers.forEach((d) => {
      const s = d.status || "Đang hoạt động";
      counts[s] = (counts[s] || 0) + 1;
    });
    const options = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ value: k, label: k, count: v }));
    return { subFilterOptions: options, subFilterLabel: "Hồ sơ / Hộ chiếu" };
  }, [activeTab, tractors, trailers, drivers]);

  // 2. Tính số lượng Ownership theo tab hiện tại
  const ownershipCounts = useMemo(() => {
    let list: Array<{ vendorId?: string }> = tractors;
    if (activeTab === "TRAILERS") list = trailers;
    if (activeTab === "DRIVERS") list = drivers;

    let internal = 0;
    let sub = 0;
    list.forEach((item) => {
      if (isInternalThilotrans(item.vendorId)) {
        internal++;
      } else {
        sub++;
      }
    });

    return { all: list.length, internal, sub };
  }, [activeTab, tractors, trailers, drivers]);

  // 3. Lọc danh sách đầu kéo
  const filteredTractors = useMemo(() => {
    let list = [...tractors];

    if (selectedOwnership === "INTERNAL") {
      list = list.filter((t) => isInternalThilotrans(t.vendorId));
    } else if (selectedOwnership === "SUBCONTRACTOR") {
      list = list.filter((t) => !isInternalThilotrans(t.vendorId));
    }

    if (subFilter !== "ALL") {
      list = list.filter((t) => t.transitRoute === subFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const qNorm = removeVietnameseTones(q);
      list = list.filter((t) => {
        const fields = [
          t.tractorNo,
          t.vendorName,
          t.vendorShortName,
          t.modelType,
          t.transitRoute,
          t.chassisNo,
        ].filter(Boolean) as string[];
        return fields.some(
          (f) =>
            f.toLowerCase().includes(q) ||
            removeVietnameseTones(f).includes(qNorm)
        );
      });
    }

    return list;
  }, [tractors, selectedOwnership, subFilter, searchTerm]);

  // 4. Lọc danh sách rơ-moóc
  const filteredTrailers = useMemo(() => {
    let list = [...trailers];

    if (selectedOwnership === "INTERNAL") {
      list = list.filter((tr) => isInternalThilotrans(tr.vendorId));
    } else if (selectedOwnership === "SUBCONTRACTOR") {
      list = list.filter((tr) => !isInternalThilotrans(tr.vendorId));
    }

    if (subFilter !== "ALL") {
      list = list.filter((tr) => tr.modelType === subFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const qNorm = removeVietnameseTones(q);
      list = list.filter((tr) => {
        const fields = [
          tr.trailerNo,
          tr.vendorName,
          tr.vendorShortName,
          tr.modelType,
          tr.manufacturer,
          tr.chassisNo,
        ].filter(Boolean) as string[];
        return fields.some(
          (f) =>
            f.toLowerCase().includes(q) ||
            removeVietnameseTones(f).includes(qNorm)
        );
      });
    }

    return list;
  }, [trailers, selectedOwnership, subFilter, searchTerm]);

  // 5. Lọc danh sách tài xế
  const filteredDrivers = useMemo(() => {
    let list = [...drivers];

    if (selectedOwnership === "INTERNAL") {
      list = list.filter((d) => isInternalThilotrans(d.vendorId));
    } else if (selectedOwnership === "SUBCONTRACTOR") {
      list = list.filter((d) => !isInternalThilotrans(d.vendorId));
    }

    if (subFilter !== "ALL") {
      list = list.filter((d) => d.status === subFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const qNorm = removeVietnameseTones(q);
      list = list.filter((d) => {
        const fields = [
          d.fullName,
          d.driverId,
          d.phone,
          d.licenseNo,
          d.hometown,
          d.vendorName,
          d.vendorShortName,
        ].filter(Boolean) as string[];
        return fields.some(
          (f) =>
            f.toLowerCase().includes(q) ||
            removeVietnameseTones(f).includes(qNorm)
        );
      });
    }

    return list;
  }, [drivers, selectedOwnership, subFilter, searchTerm]);

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* 1. Header Trang */}
      <PageHeader
        title="Quản lý Đội xe"
        description="Danh mục 752 đầu kéo, 873 rơ-moóc và 669 tài xế vận tải đường bộ nội địa & liên vận quốc tế THILOGI."
        actions={<RefreshButton onClick={loadData} loading={loading} />}
      />

      {/* 2. Thanh lọc Tabs & Phân Loại Đa Chiều */}
      <FleetFilterBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tractorCount={tractors.length}
        trailerCount={trailers.length}
        driverCount={drivers.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedOwnership={selectedOwnership}
        onOwnershipChange={setSelectedOwnership}
        ownershipCounts={ownershipCounts}
        subFilter={subFilter}
        onSubFilterChange={setSubFilter}
        subFilterOptions={subFilterOptions}
        subFilterLabel={subFilterLabel}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Bảng Dữ Liệu Tương Ứng Với Tab Đang Chọn */}
      {activeTab === "TRACTORS" && (
        <TractorsTable
          tractors={filteredTractors}
          loading={loading}
          loadError={loadError}
          onRetry={loadData}
          onView={(t) => setSelectedDrawerItem({ type: "TRACTOR", data: t })}
          filterKey={JSON.stringify([
            activeTab,
            selectedOwnership,
            subFilter,
            searchTerm,
          ])}
        />
      )}

      {activeTab === "TRAILERS" && (
        <TrailersTable
          trailers={filteredTrailers}
          loading={loading}
          loadError={loadError}
          onRetry={loadData}
          onView={(tr) => setSelectedDrawerItem({ type: "TRAILER", data: tr })}
          filterKey={JSON.stringify([
            activeTab,
            selectedOwnership,
            subFilter,
            searchTerm,
          ])}
        />
      )}

      {activeTab === "DRIVERS" && (
        <DriversTable
          drivers={filteredDrivers}
          loading={loading}
          loadError={loadError}
          onRetry={loadData}
          onView={(d) => setSelectedDrawerItem({ type: "DRIVER", data: d })}
          filterKey={JSON.stringify([
            activeTab,
            selectedOwnership,
            subFilter,
            searchTerm,
          ])}
        />
      )}

      {/* 4. Slide-out Drawer Xem Chi Tiết Hồ Sơ Tài Sản / Lái Xe */}
      <FleetDetailDrawer
        item={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
      />
    </div>
  );
}
