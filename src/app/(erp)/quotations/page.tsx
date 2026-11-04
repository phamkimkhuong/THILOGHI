"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, RefreshButton, TableFeedback, Pagination, usePagination, useListFeedback } from "@/components/ui/list-page";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Printer,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X,
  FileText,
  DollarSign,
  Layers,
  ArrowRight,
  Building2,
  Lock,
  RotateCcw,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { exportQuotationToExcel } from "@/shared/utils/excel";
import {
  getQuotationRegionsAction,
  getQuotationsListAction,
  getQuotationDetailAction,
  approveQuotationAction,
  rejectQuotationAction,
  returnQuotationToDraftAction,
} from "@/features/quotation/actions";
import {
  QuotationListItem,
  QuotationDetailResponse,
} from "@/server/modules/quotation/quotation.service";

export default function QuotationListPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Drawer detail state
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<QuotationDetailResponse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Customer printable sheet modal state

  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { loading, error: loadError, runLoad } = useListFeedback("quotations_list");
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const detailRequest = useRef(0);

  const loadQuotations = useCallback(() => {
    void runLoad(async (isCurrent) => {
      const [res, regionRes] = await Promise.all([getQuotationsListAction({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        regionId: regionFilter === "ALL" ? undefined : regionFilter,
        search: searchTerm || undefined, limit: 250,
      }), getQuotationRegionsAction()]);
      if (!res.success || !regionRes.success) throw new Error("Load failed");
      if (!isCurrent()) return;
      setQuotations(res.data); setRegions(regionRes.data);
    });
  }, [statusFilter, regionFilter, searchTerm, runLoad]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuotations();
  };

  // Mở Slide-over Drawer
  const handleOpenDrawer = (quotationId: string) => {
    const requestId = ++detailRequest.current;
    setDrawerDetail(null);
    setSelectedQuotationId(quotationId);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setActionMessage(null);

    startTransition(async () => {
      try {
        const res = await getQuotationDetailAction(quotationId);
        if (requestId === detailRequest.current && res.success && res.data) {
          setDrawerDetail(res.data);
        }
      } catch {
        // The drawer offers a retry instead of displaying an earlier quote.
      } finally {
        if (requestId === detailRequest.current) setDrawerLoading(false);
      }
    });
  };

  // Mở bản in khách hàng (Commercial Customer Sheet)
  const handleOpenPrintModal = (quotationId: string) => { router.push(`/quotations/print?id=${quotationId}`); };

  // Phê duyệt nhanh ngay trong Drawer
  const handleApproveFromDrawer = async () => {
    if (!selectedQuotationId || !drawerDetail) return;
    const margin = drawerDetail.quote.estimatedMarginPercent;
    let comment: string | undefined;

    if (margin < 15) {
      const input = prompt(
        `Biên lợi nhuận (${margin}%) thấp hơn 15%. Vui lòng nhập lý do phê duyệt ngoại lệ:`
      );
      if (!input || input.trim().length < 5) {
        alert("Bắt buộc nhập lý do phê duyệt ngoại lệ (tối thiểu 5 ký tự).");
        return;
      }
      comment = input.trim();
    }

    startTransition(async () => {
      const res = await approveQuotationAction(selectedQuotationId, comment);
      if (res.success) {
        setActionMessage({ type: "success", text: res.message || "Đã phê duyệt thành công." });
        // Tải lại chi tiết trong drawer và danh sách
        const updated = await getQuotationDetailAction(selectedQuotationId);
        if (updated.success && updated.data) setDrawerDetail(updated.data);
        loadQuotations();
      } else {
        setActionMessage({ type: "error", text: res.error || "Lỗi khi phê duyệt." });
      }
    });
  };

  // Từ chối ngay trong Drawer
  const handleRejectFromDrawer = async () => {
    if (!selectedQuotationId) return;
    const comment = prompt("Vui lòng nhập lý do từ chối báo giá:");
    if (!comment || comment.trim().length === 0) return;

    startTransition(async () => {
      const res = await rejectQuotationAction(selectedQuotationId, comment.trim());
      if (res.success) {
        setActionMessage({ type: "success", text: res.message || "Đã từ chối báo giá." });
        const updated = await getQuotationDetailAction(selectedQuotationId);
        if (updated.success && updated.data) setDrawerDetail(updated.data);
        loadQuotations();
      } else {
        setActionMessage({ type: "error", text: res.error || "Lỗi khi từ chối." });
      }
    });
  };

  // Trả về bản nháp ngay trong Drawer
  const handleReturnToDraftFromDrawer = async () => {
    if (!selectedQuotationId) return;
    const comment = prompt("Vui lòng nhập ý kiến yêu cầu chỉnh sửa lại báo giá:");
    if (!comment || comment.trim().length === 0) return;

    startTransition(async () => {
      const res = await returnQuotationToDraftAction(selectedQuotationId, comment.trim());
      if (res.success) {
        setActionMessage({ type: "success", text: res.message || "Đã trả báo giá về bản nháp." });
        const updated = await getQuotationDetailAction(selectedQuotationId);
        if (updated.success && updated.data) setDrawerDetail(updated.data);
        loadQuotations();
      } else {
        setActionMessage({ type: "error", text: res.error || "Lỗi khi trả về bản nháp." });
      }
    });
  };

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const statusBadges: Record<string, { label: string; icon: typeof Clock; className: string }> = {
    DRAFT: {
      label: "Bản Nháp",
      icon: Clock,
      className: "bg-surface-hover text-muted-foreground border-border",
    },
    PENDING_APPROVAL: {
      label: "Chờ Duyệt",
      icon: AlertTriangle,
      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    },
    APPROVED: {
      label: "Đã Duyệt",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    },
    REJECTED: {
      label: "Từ Chối",
      icon: XCircle,
      className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    },
  };

  const regionOptions = [{ id: "ALL", name: "Tất cả phân vùng" }, ...regions];
  const pagination = usePagination(quotations.length, JSON.stringify([statusFilter, regionFilter, searchTerm]));

  return (
    <div className="space-y-4 font-sans text-foreground">
      <PageHeader title="Báo giá" actions={<><RefreshButton onClick={loadQuotations} loading={loading} /><Link href="/quotations/new" className="erp-button bg-primary text-primary-foreground hover:opacity-90 shadow-xs"><PlusCircle className="h-4 w-4" />Lập báo giá</Link></>} />

      {/* Multi-Filter & Search Bar */}
      <div className="p-2.5 rounded-xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "PENDING_APPROVAL", label: "Chờ duyệt" },
            { id: "APPROVED", label: "Đã duyệt" },
            { id: "DRAFT", label: "Bản nháp" },
            { id: "REJECTED", label: "Từ chối" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Region & Search Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Region Dropdown */}
           <select aria-label="Phân vùng" value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            {regionOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm số báo giá, khách hàng..." aria-label="Tìm số báo giá, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-surface border border-border hover:bg-surface-hover text-foreground rounded-lg text-xs font-medium shadow-xs"
            >
              Tìm
            </button>
          </form>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
          <table className="erp-table w-full text-left text-xs">
            <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2.5 px-3">Số Báo Giá</th>
                <th className="py-2.5 px-3">Khách Hàng</th>
                <th className="py-2.5 px-3">Phân Vùng</th>
                <th className="py-2.5 px-3">Tuyến / Thiết Bị</th>
                <th className="py-2.5 px-3 text-right">Doanh Thu (SELL)</th>
                <th className="py-2.5 px-3 text-right">Lãi Gộp (GP)</th>
                <th className="py-2.5 px-3 text-center">Margin %</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                <th className="py-2.5 px-3">Người Lập</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-sans">
              {loading || loadError ? <TableFeedback columns={10} loading={loading} error={loadError} onRetry={loadQuotations} /> : quotations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8">
                    <EmptyState
                      title="Không tìm thấy hồ sơ báo giá phù hợp"
                      description="Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc lại theo trạng thái / phân vùng."
                      action={
                        <Link href="/quotations/new" className="erp-button bg-primary text-white hover:bg-primary-hover shadow-xs font-bold inline-flex items-center gap-1.5">
                          <PlusCircle className="w-4 h-4" /> Lập báo giá mới
                        </Link>
                      }
                    />
                  </td>
                </tr>
              ) : (
                quotations.slice(pagination.start, pagination.end).map((q) => {
                  const badge = statusBadges[q.status] || { label: q.status, icon: Clock, className: "bg-surface-hover text-muted-foreground border-border" };
                  const Icon = badge.icon;
                  const isSelected = selectedQuotationId === q.quotationId && isDrawerOpen;

                  return (
                    <tr
                      key={q.quotationId}
                      onClick={() => handleOpenDrawer(q.quotationId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-900/20"
                          : "hover:bg-surface-hover"
                      }`}
                    >
                      {/* Số Báo Giá */}
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                        <span className="text-primary hover:underline flex items-center gap-1.5 font-bold">
                          {q.quotationNo}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-muted-foreground font-normal border border-border">
                            v{q.version}
                          </span>
                        </span>
                      </td>

                      {/* Khách Hàng */}
                      <td className="py-2.5 px-3 font-semibold text-foreground max-w-[200px] truncate" title={q.customerName}>
                        {q.customerName}
                      </td>

                      {/* Phân Vùng */}
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                        {q.regionName}
                      </td>

                      {/* Tuyến / Thiết Bị */}
                      <td className="py-2.5 px-3 max-w-[190px] truncate text-xs text-muted-foreground" title={q.routeSummary}>
                        {q.routeSummary ? (
                          <div className="flex items-center gap-1 truncate">
                            <span className="truncate text-foreground font-medium">{q.routeSummary}</span>
                            {q.equipmentType && (
                              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-hover text-primary shrink-0 border border-border">
                                {q.equipmentType}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Chưa chọn tuyến</span>
                        )}
                      </td>

                      {/* Doanh Thu SELL */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                        {formatVND(q.totalSellAmount)}
                      </td>

                      {/* Lãi Gộp GP */}
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-semibold whitespace-nowrap ${
                          q.estimatedGp >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatVND(q.estimatedGp)}
                      </td>

                      {/* Margin % */}
                      <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            q.estimatedMarginPercent >= 15
                              ? "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                              : q.estimatedMarginPercent >= 5
                              ? "text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20"
                              : "text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20"
                          }`}
                        >
                          {q.estimatedMarginPercent}%
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                        >
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>

                      {/* Người Lập */}
                      <td className="py-2.5 px-3 text-muted-foreground text-xs truncate max-w-[130px]" title={q.createdBy}>
                        {q.createdBy}
                      </td>

                      {/* Thao tác */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status === "APPROVED" && (
                            <button
                              onClick={() => handleOpenPrintModal(q.quotationId)}
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-600/15 dark:hover:bg-emerald-600/25 dark:text-emerald-300 dark:border-emerald-500/30 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Xuất bảng chào giá thương mại cho khách hàng"
                            >
                              <Printer className="w-3 h-3" />
                              Bản in
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDrawer(q.quotationId)}
                            className="px-2.5 py-1 rounded bg-surface border border-border hover:bg-surface-hover text-foreground text-xs font-medium flex items-center gap-0.5 transition-colors shadow-xs"
                          >
                            Chi tiết <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} loading={loading} error={!!loadError} loaded={quotations.length} limit={250} />
      </div>

      {/* ==================================================================== */}
      {/* SLIDE-OVER DRAWER (Panel trượt chi tiết bên phải) */}
      {/* ==================================================================== */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => { detailRequest.current++; setIsDrawerOpen(false); }}
          />

          {/* Drawer Window */}
          <div className="relative w-full max-w-2xl bg-surface border-l border-border h-full overflow-y-auto shadow-2xl flex flex-col z-10 text-foreground">
            {/* Drawer Header */}
            <div className="h-16 px-5 border-b border-border flex items-center justify-between bg-surface/95 sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {drawerDetail?.quote.quotationNo || "Chi tiết báo giá"}
                    </span>
                    {drawerDetail && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-muted-foreground font-mono border border-border">
                        v{drawerDetail.quote.version}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Chi tiết báo giá
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {drawerDetail && (
                  <>
                    <button
                      type="button"
                      title="Xuất Báo giá ra file Excel (.xlsx)"
                      onClick={() => {
                        void exportQuotationToExcel({
                          quotationNo: drawerDetail.quote.quotationNo,
                          version: drawerDetail.quote.version,
                          customerName: drawerDetail.quote.customerName,
                          taxCode: drawerDetail.quote.taxCode,
                          commodity: drawerDetail.quote.commodityName,
                          paymentTermsDays: drawerDetail.quote.paymentTermsDays,
                          approvedAt: drawerDetail.quote.approvedAt,
                          currency: "VND",
                          totalSellAmount: drawerDetail.quote.totalSellAmount,
                          items: drawerDetail.items.map((i) => ({
                            service: i.servicePackage,
                            origin: i.originName || i.originLocationId,
                            destination: i.destinationName || i.destinationLocationId,
                            equipment: i.equipmentType,
                            quantity: Number(i.plannedQuantity),
                            unit: i.unit,
                            unitPrice: Number(i.unitSellPrice),
                            amount: Number(i.totalSellPrice),
                            inclusion: i.pricingInclusion,
                          })),
                        });
                      }}
                      className="px-2.5 py-1 rounded bg-surface border border-border text-foreground hover:bg-surface-hover text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                    </button>
                    <Link
                      href={`/quotations/new?id=${drawerDetail.quote.quotationId}`}
                      className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50"
                    >
                      Mở báo giá
                    </Link>
                  </>
                )}
                <button
                  onClick={() => { detailRequest.current++; setIsDrawerOpen(false); }}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Banner inside Drawer */}
            {actionMessage && (
              <div
                className={`m-4 p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  actionMessage.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {actionMessage.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Drawer Body Content */}
            {drawerLoading ? (
              <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Đang tải chi tiết báo giá…
              </div>
            ) : !drawerDetail ? (
              <div className="flex-1 p-8 text-center text-muted-foreground text-xs">
                <p role="alert">Không tải được chi tiết báo giá.</p>
                <button type="button" className="erp-button mt-3 border border-border" onClick={() => selectedQuotationId && handleOpenDrawer(selectedQuotationId)}>Thử lại</button>
              </div>
            ) : (
              <div className="flex-1 p-5 space-y-6">
                {/* Status Bar */}
                <div className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Trạng thái Hồ Sơ:</div>
                    <div className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                      {drawerDetail.quote.status === "APPROVED" && (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> ĐÃ PHÊ DUYỆT (IMMUTABLE LOCKED)
                        </span>
                      )}
                      {drawerDetail.quote.status === "PENDING_APPROVAL" && (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> CHỜ HỘI ĐỒNG PHÊ DUYỆT
                        </span>
                      )}
                      {drawerDetail.quote.status === "DRAFT" && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Bản nháp
                        </span>
                      )}
                      {drawerDetail.quote.status === "REJECTED" && (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> ĐÃ TỪ CHỐI (REJECTED)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {drawerDetail.quote.status === "APPROVED" && (
                      <button
                        onClick={() => handleOpenPrintModal(drawerDetail.quote.quotationId)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Xuất Bảng Giá Khách Hàng
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 1: Customer & Commercial Terms */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Khách Hàng & Điều Khoản Thương Mại
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-background border border-border text-xs">
                    <div>
                      <span className="text-muted-foreground block text-xs">Đơn vị khách hàng:</span>
                      <strong className="text-foreground font-semibold mt-0.5 block">
                        {drawerDetail.quote.customerName}
                      </strong>
                      {drawerDetail.quote.taxCode && (
                        <span className="text-muted-foreground font-mono text-xs block mt-0.5">
                          MST: {drawerDetail.quote.taxCode}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-xs">Phân vùng áp dụng:</span>
                      <strong className="text-foreground font-semibold mt-0.5 block">
                        {drawerDetail.quote.regionName}
                      </strong>
                      <span className="text-muted-foreground text-xs block mt-0.5">
                        Hạn thanh toán: <strong className="text-foreground">{drawerDetail.quote.paymentTermsDays} ngày</strong>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground block text-xs">Người lập báo giá:</span>
                      <span className="text-foreground font-medium text-xs mt-0.5 block">
                        {drawerDetail.quote.createdBy}
                      </span>
                      <span className="text-muted-foreground text-xs font-mono block">
                        Ngày tạo: {new Date(drawerDetail.quote.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground block text-xs">Người thẩm định duyệt:</span>
                      <span className="text-foreground font-medium text-xs mt-0.5 block">
                        {drawerDetail.quote.approvedBy || "Chưa phê duyệt"}
                      </span>
                      {drawerDetail.quote.approvedAt && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-mono block">
                          Ngày duyệt: {new Date(drawerDetail.quote.approvedAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: P&L Summary Matrix */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Hiệu Quả Kinh Doanh P&L (Chuẩn VND)
                  </div>
                  <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-background border border-border text-center font-mono">
                    <div className="p-2 rounded bg-surface border border-border shadow-xs">
                      <span className="text-xs text-muted-foreground block font-sans">Doanh Thu (SELL)</span>
                      <span className="text-xs font-bold text-foreground mt-1 block">
                        {formatVND(drawerDetail.quote.totalSellAmount)}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-surface border border-border shadow-xs">
                      <span className="text-xs text-muted-foreground block font-sans">Giá Vốn (BUY)</span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                        {formatVND(drawerDetail.quote.totalEstimatedBuy)}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-surface border border-border shadow-xs">
                      <span className="text-xs text-muted-foreground block font-sans">Lãi Gộp (GP)</span>
                      <span
                        className={`text-xs font-bold mt-1 block ${
                          drawerDetail.quote.estimatedGp >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatVND(drawerDetail.quote.estimatedGp)}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-surface border border-border shadow-xs">
                      <span className="text-xs text-muted-foreground block font-sans">Biên Lợi Nhuận</span>
                      <span
                        className={`text-xs font-semibold mt-1 block ${
                          drawerDetail.quote.estimatedMarginPercent >= 15
                            ? "text-emerald-600 dark:text-emerald-400"
                            : drawerDetail.quote.estimatedMarginPercent >= 5
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {drawerDetail.quote.estimatedMarginPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Service Items & Routes */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Danh Mục Dịch Vụ Logistics ({drawerDetail.items.length})
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">ORDER_SERVICE_ITEMS</span>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-hover text-muted-foreground text-xs uppercase border-b border-border">
                        <tr>
                          <th className="py-2 px-3">Dịch Vụ / Tuyến</th>
                          <th className="py-2 px-2 text-center">Thiết Bị</th>
                          <th className="py-2 px-2 text-center">SL</th>
                          <th className="py-2 px-3 text-right">Giá Bán (SELL)</th>
                          <th className="py-2 px-3 text-right">Giá Mua (BUY)</th>
                          <th className="py-2 px-2 text-center">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-sans">
                        {drawerDetail.items.map((it, idx) => (
                          <tr key={it.itemId || idx} className="hover:bg-surface-hover transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-foreground">
                                #{idx + 1}. {it.servicePackage}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <span>{it.originName || "Điểm đi"}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span>{it.destinationName || "Điểm đến"}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-xs text-primary font-bold">
                              {it.equipmentType}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-xs text-foreground">
                              {it.plannedQuantity} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                              {formatVND(it.totalSellPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                              {formatVND(it.estimatedBuyAmount)}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-xs">
                              <span
                                className={
                                  it.itemMarginPercent >= 15
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : it.itemMarginPercent >= 5
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-rose-600 dark:text-rose-400"
                                }
                              >
                                {it.itemMarginPercent}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 4: BUY Snapshot (Thẩm định giá mua NCC nội bộ) */}
                {drawerDetail.snapshots.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Giá mua đã lưu · Nội bộ
                      </span>
                      <span className="text-xs text-amber-600/80 dark:text-amber-400/80 font-mono">Chỉ đọc</span>
                    </div>

                    <div className="space-y-1.5">
                      {drawerDetail.snapshots.map((s, sIdx) => (
                        <div
                          key={s.snapshotId || sIdx}
                          className="p-3 rounded-lg bg-background border border-border text-xs flex items-center justify-between shadow-xs"
                        >
                          <div>
                            <div className="font-semibold text-foreground">{s.vendorName}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">
                              Hiệu lực: {s.validityStart} &rarr; {s.validityEnd}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              Đơn giá: {formatVND(s.rateAmountVnd)}
                            </div>
                            {s.originalCurrency !== "VND" && (
                              <div className="text-xs text-muted-foreground font-mono">
                                ({s.rateAmount} {s.originalCurrency} • FX {s.fxRateToVnd})
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5: Approval Audit Trail */}
                {drawerDetail.approvalLogs.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      Nhật Ký Thẩm Định & Phê Duyệt (Audit Trail)
                    </div>

                    <div className="space-y-1.5">
                      {drawerDetail.approvalLogs.map((log) => (
                        <div
                          key={log.logId}
                          className="p-2.5 rounded-lg bg-background border border-border text-xs flex items-start justify-between gap-3 shadow-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${
                                  log.action === "APPROVED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                                    : log.action === "REJECTED"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300"
                                    : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300"
                                }`}
                              >
                                {log.action}
                              </span>
                              <span className="font-semibold text-foreground">
                                {log.actorName || log.actorId}
                              </span>
                            </div>
                            {log.comment && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                &ldquo;{log.comment}&rdquo;
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs text-muted-foreground font-mono block">
                              {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                            {log.snapshotMarginPercent != null && (
                              <span className="text-xs text-muted-foreground font-mono block">
                                Margin: {log.snapshotMarginPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Drawer Footer Actions (When PENDING_APPROVAL) */}
            {drawerDetail && drawerDetail.quote.status === "PENDING_APPROVAL" && (
              <div className="p-4 border-t border-border bg-surface shrink-0 flex items-center justify-between gap-2">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Chờ thẩm định
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReturnToDraftFromDrawer}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-foreground text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Trả về nháp
                  </button>
                  <button
                    onClick={handleRejectFromDrawer}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 dark:text-rose-300 dark:border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ Chối
                  </button>
                  <button
                    onClick={handleApproveFromDrawer}
                    disabled={isPending}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Phê Duyệt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}

      {/* ==================================================================== */}
    </div>
  );
}
