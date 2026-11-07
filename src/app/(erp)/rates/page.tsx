"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { FileSpreadsheet, FileUp } from "lucide-react";
import { PageHeader, RefreshButton, useListFeedback } from "@/components/ui/list-page";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { getRoadRatesAction } from "@/features/master-data/actions";
import { exportRoadRatesToExcel } from "@/shared/utils/excel";

import { RatesRouteMatcher } from "./_components/rates-route-matcher";
import { RatesFilterBar } from "./_components/rates-filter-bar";
import { RatesTable } from "./_components/rates-table";
import { RatesImportDialog } from "./_components/rates-import-dialog";
import type { RoadRateItem, RoadRateSortOption } from "./_components/types";

export default function RoadRatesLibraryPage() {
  useDocumentTitle("Giá mua đường bộ");

  // Server State
  const [rates, setRates] = useState<RoadRateItem[]>([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("ALL");
  const [sortBy, setSortBy] = useState<RoadRateSortOption>("route");

  // Quick Route Matcher State
  const [matcherOrigin, setMatcherOrigin] = useState("ALL");
  const [matcherDest, setMatcherDest] = useState("ALL");
  const [matcherEquipment, setMatcherEquipment] = useState("ALL");

  // Import Dialog State
  const [importOpen, setImportOpen] = useState(false);

  const { loading, error: loadError, runLoad } = useListFeedback("road_rates_list");

  // Nạp dữ liệu từ Server Action
  const loadRates = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const res = await getRoadRatesAction();
      if (!res.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      if (res.success && res.data) {
        setRates(res.data as RoadRateItem[]);
      }
    });
  }, [runLoad]);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

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
      />

      {/* 5. Modal Nhập Biểu Cước Excel Hàng Loạt */}
      <RatesImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={loadRates}
      />
    </div>
  );
}
