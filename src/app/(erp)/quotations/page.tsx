"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { PageHeader, RefreshButton, usePagination, useListFeedback } from "@/components/ui/list-page";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import {
  getQuotationRegionsAction,
  getQuotationsListAction,
  getQuotationDetailAction,
} from "@/features/quotation/actions";
import { QuotationsFilterBar } from "./_components/quotations-filter-bar";
import { QuotationsTable } from "./_components/quotations-table";
import { QuotationsDetailDrawer } from "./_components/quotations-detail-drawer";
import { QuotationsActionDialogs } from "./_components/quotations-action-dialogs";
import {
  removeVietnameseTones,
  type QuotationListItem,
  type QuotationDetailResponse,
  type ActionDialogState,
  type ActionDialogType,
} from "./_components/types";

export default function QuotationListPage() {
  useDocumentTitle("Quản lý Báo giá");
  const router = useRouter();

  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Slide-over Drawer State
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<QuotationDetailResponse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const detailRequest = useRef(0);

  // Approval / Rejection / Return-to-draft Dialog State
  const [actionDialog, setActionDialog] = useState<ActionDialogState | null>(null);
  const [, startTransition] = useTransition();

  const { loading, error: loadError, runLoad } = useListFeedback("quotations_list");

  const loadQuotations = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const [res, regionRes] = await Promise.all([
        getQuotationsListAction({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          regionId: regionFilter === "ALL" ? undefined : regionFilter,
          search: searchTerm || undefined,
          limit: 250,
        }),
        getQuotationRegionsAction(),
      ]);
      if (!res.success || !regionRes.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      setQuotations(res.data);
      setRegions(regionRes.data);
    });
  }, [statusFilter, regionFilter, searchTerm, runLoad]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  // Tìm kiếm Tiếng Việt không dấu tức thì trên Client
  const filteredQuotations = useMemo(() => {
    if (!searchTerm.trim()) return quotations;
    const qNorm = removeVietnameseTones(searchTerm.trim());
    return quotations.filter((q) => {
      const fields = [
        q.quotationNo,
        q.customerName,
        q.regionName,
        q.routeSummary || "",
        q.equipmentType || "",
        q.createdBy,
      ];
      return fields.some((f) => removeVietnameseTones(f).includes(qNorm));
    });
  }, [quotations, searchTerm]);

  const pagination = usePagination(
    filteredQuotations.length,
    JSON.stringify([statusFilter, regionFilter, searchTerm])
  );

  // Mở Slide-over Drawer tra cứu chi tiết
  const handleOpenDrawer = useCallback((quotationId: string) => {
    const requestId = ++detailRequest.current;
    setDrawerDetail(null);
    setSelectedQuotationId(quotationId);
    setIsDrawerOpen(true);
    setDrawerLoading(true);

    startTransition(async () => {
      try {
        const res = await getQuotationDetailAction(quotationId);
        if (requestId === detailRequest.current && res.success && res.data) {
          setDrawerDetail(res.data);
        }
      } finally {
        if (requestId === detailRequest.current) setDrawerLoading(false);
      }
    });
  }, []);

  // Mở bản in khách hàng (Commercial Customer Sheet)
  const handleOpenPrintModal = useCallback(
    (quotationId: string) => {
      router.push(`/quotations/print?id=${quotationId}`);
    },
    [router]
  );

  // Yêu cầu hành động phê duyệt / từ chối / trả về nháp từ Drawer
  const handleRequestAction = (type: ActionDialogType) => {
    if (!drawerDetail) return;
    setActionDialog({
      type,
      quotationId: drawerDetail.quote.quotationId,
      quotationNo: drawerDetail.quote.quotationNo,
      margin: drawerDetail.quote.estimatedMarginPercent,
    });
  };

  // Làm mới chi tiết sau khi thao tác phê duyệt thành công
  const handleActionSuccess = () => {
    loadQuotations();
    if (selectedQuotationId) {
      handleOpenDrawer(selectedQuotationId);
    }
  };

  return (
    <div className="space-y-4 font-sans text-foreground">
      {/* 1. Tiêu đề trang chuẩn SalesFlow */}
      <PageHeader
        title="Báo giá"
        description="Quản lý và phê duyệt hồ sơ báo giá cước dịch vụ logistics"
        actions={
          <>
            <RefreshButton onClick={loadQuotations} loading={loading} />
            <Link
              href="/quotations/new"
              className="erp-button bg-primary text-primary-foreground hover:opacity-90 shadow-xs inline-flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              Lập báo giá
            </Link>
          </>
        }
      />

      {/* 2. Thanh lọc chuẩn: ChipScrollRow + SearchInput */}
      <QuotationsFilterBar
        status={statusFilter}
        onStatusChange={setStatusFilter}
        regionId={regionFilter}
        onRegionChange={setRegionFilter}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        regions={regions}
        totalCount={filteredQuotations.length}
      />

      {/* 3. Bảng dữ liệu chuẩn: TableContainer + Pagination */}
      <QuotationsTable
        quotations={filteredQuotations}
        loading={loading}
        error={loadError}
        onRetry={loadQuotations}
        selectedQuotationId={selectedQuotationId}
        isDrawerOpen={isDrawerOpen}
        onSelectQuotation={handleOpenDrawer}
        onOpenPrint={handleOpenPrintModal}
        pagination={pagination}
      />

      {/* 4. Slide-over Drawer chuẩn ResponsiveDrawer */}
      <QuotationsDetailDrawer
        open={isDrawerOpen}
        onClose={() => {
          detailRequest.current++;
          setIsDrawerOpen(false);
        }}
        loading={drawerLoading}
        detail={drawerDetail}
        onRetry={() => selectedQuotationId && handleOpenDrawer(selectedQuotationId)}
        onOpenPrint={handleOpenPrintModal}
        onRequestAction={handleRequestAction}
      />

      {/* 5. Modal Phê duyệt / Từ chối / Trả về nháp chuẩn ModalDialog (thay thế prompt/alert) */}
      <QuotationsActionDialogs
        state={actionDialog}
        onClose={() => setActionDialog(null)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
