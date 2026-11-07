"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { PageHeader, RefreshButton, useListFeedback } from "@/components/ui/list-page";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { getPartnersDirectoryAction } from "@/features/master-data/actions";

import { PartnerFilterBar } from "./_components/partner-filter-bar";
import { PartnerTable } from "./_components/partner-table";
import { PartnerDetailDrawer } from "./_components/partner-detail-drawer";
import { PartnerFormDialog } from "./_components/partner-form-dialog";
import {
  removeVietnameseTones,
  type PartnerDirectoryItem,
} from "./_components/types";

export default function MasterCustomersPage() {
  useDocumentTitle("Danh bạ Đối tác THILOGI");

  // Server State
  const [partners, setPartners] = useState<PartnerDirectoryItem[]>([]);

  // Filter States
  const [selectedPartnerType, setSelectedPartnerType] = useState("ALL");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Drawer & Form States
  const [selectedDrawerPartner, setSelectedDrawerPartner] = useState<PartnerDirectoryItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerDirectoryItem | null>(null);

  const { loading, error: loadError, runLoad } = useListFeedback("customers_directory_cache");

  // Nạp dữ liệu từ Server Action
  const loadData = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const res = await getPartnersDirectoryAction();
      if (!res.success) throw new Error(res.error || "Không thể tải danh bạ đối tác");
      if (!isCurrent()) return;
      setPartners((res.data || []) as PartnerDirectoryItem[]);
    });
  }, [runLoad]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mở Form Thêm Mới
  const handleOpenCreate = () => {
    setEditingPartner(null);
    setIsFormOpen(true);
  };

  // Mở Form Chỉnh Sửa
  const handleOpenEdit = (p: PartnerDirectoryItem) => {
    setEditingPartner(p);
    setIsFormOpen(true);
  };

  // Mở Drawer Xem Chi Tiết
  const handleOpenDrawer = (item: PartnerDirectoryItem) => {
    setSelectedDrawerPartner(item);
  };

  // Reset toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSelectedPartnerType("ALL");
    setSelectedCountry("ALL");
    setSelectedStatus("ALL");
    setSearchTerm("");
  };

  // Tính toán số lượng theo 9 Phân nhóm
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: partners.length };
    for (const p of partners) {
      const type = p.sourcePartnerType;
      if (type) {
        counts[type] = (counts[type] || 0) + 1;
      }
    }
    return counts;
  }, [partners]);

  // Tính toán số lượng theo Quốc gia
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: partners.length,
      VN: 0,
      CN: 0,
      LA: 0,
      KH: 0,
      OTHER: 0,
    };
    for (const p of partners) {
      const c = (p.country || "").toLowerCase().trim();
      if (c.includes("việt nam") || c.includes("viet nam") || c === "vn") {
        counts.VN = (counts.VN || 0) + 1;
      } else if (c.includes("trung quốc") || c.includes("china") || c === "cn") {
        counts.CN = (counts.CN || 0) + 1;
      } else if (c.includes("lào") || c.includes("lao") || c.includes("laos")) {
        counts.LA = (counts.LA || 0) + 1;
      } else if (c.includes("cambodia") || c.includes("campuchia") || c === "kh") {
        counts.KH = (counts.KH || 0) + 1;
      } else {
        counts.OTHER = (counts.OTHER || 0) + 1;
      }
    }
    return counts;
  }, [partners]);

  // Bộ lọc dữ liệu đối tác đa chiều
  const filteredPartners = useMemo(() => {
    let list = [...partners];

    // 1. Phân nhóm
    if (selectedPartnerType !== "ALL") {
      list = list.filter((p) => p.sourcePartnerType === selectedPartnerType);
    }

    // 2. Quốc gia
    if (selectedCountry !== "ALL") {
      list = list.filter((p) => {
        const c = (p.country || "").toLowerCase().trim();
        if (selectedCountry === "VN") {
          return c.includes("việt nam") || c.includes("viet nam") || c === "vn";
        }
        if (selectedCountry === "CN") {
          return c.includes("trung quốc") || c.includes("china") || c === "cn";
        }
        if (selectedCountry === "LA") {
          return c.includes("lào") || c.includes("lao") || c.includes("laos");
        }
        if (selectedCountry === "KH") {
          return c.includes("cambodia") || c.includes("campuchia") || c === "kh";
        }
        if (selectedCountry === "OTHER") {
          const isVN = c.includes("việt nam") || c.includes("viet nam") || c === "vn";
          const isCN = c.includes("trung quốc") || c.includes("china") || c === "cn";
          const isLA = c.includes("lào") || c.includes("lao") || c.includes("laos");
          const isKH = c.includes("cambodia") || c.includes("campuchia") || c === "kh";
          return !isVN && !isCN && !isLA && !isKH;
        }
        return true;
      });
    }

    // 3. Trạng thái
    if (selectedStatus !== "ALL") {
      list = list.filter((p) => (p.status || "ACTIVE") === selectedStatus);
    }

    // 4. Tìm kiếm (hỗ trợ tiếng Việt không dấu)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const qNorm = removeVietnameseTones(q);
      list = list.filter((p) => {
        const fields = [
          p.partnerName,
          p.shortName,
          p.taxCode,
          p.partnerId,
          p.address,
          p.representedBy,
          p.phone,
          p.email,
          p.country,
        ].filter(Boolean) as string[];
        return fields.some(
          (f) => f.toLowerCase().includes(q) || removeVietnameseTones(f).includes(qNorm)
        );
      });
    }

    return list;
  }, [partners, selectedPartnerType, selectedCountry, selectedStatus, searchTerm]);

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* 1. Page Header */}
      <PageHeader
        title="Quản lý Đối tác"
        description="Danh bạ pháp nhân khách hàng, nhà xe thầu phụ, hãng tàu và các đối tác hạ bãi toàn hệ thống THILOGI."
        actions={
          <>
            <RefreshButton onClick={loadData} loading={loading} />
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-1" /> Thêm đối tác
            </Button>
          </>
        }
      />

      {/* 2. Thanh lọc Tabs & Toolbar Chuyên Nghiệp */}
      <PartnerFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPartnerType={selectedPartnerType}
        onPartnerTypeChange={setSelectedPartnerType}
        typeCounts={typeCounts}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        countryCounts={countryCounts}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Bảng Dữ Liệu Nghiệp Vụ Vận Tải Logistics */}
      <PartnerTable
        partners={filteredPartners}
        loading={loading}
        loadError={loadError}
        onRetry={loadData}
        onViewPartner={handleOpenDrawer}
        onEditPartner={handleOpenEdit}
        filterKey={JSON.stringify([
          selectedPartnerType,
          selectedCountry,
          selectedStatus,
          searchTerm,
        ])}
      />

      {/* 4. Slide-out Drawer Chi Tiết Hồ Sơ Đối Tác */}
      <PartnerDetailDrawer
        partner={selectedDrawerPartner}
        onClose={() => setSelectedDrawerPartner(null)}
        onEdit={handleOpenEdit}
      />

      {/* 5. Modal Form Thêm Mới / Chỉnh Sửa Đối Tác */}
      <PartnerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingPartner}
        onSuccess={loadData}
      />
    </div>
  );
}
