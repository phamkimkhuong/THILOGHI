"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader, RefreshButton, TableFeedback, Pagination, usePagination, useListFeedback } from "@/components/ui/list-page";
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
} from "lucide-react";
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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDetail, setPrintDetail] = useState<QuotationDetailResponse | null>(null);
  const printRequest = useRef(0);

  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { loading, error: loadError, runLoad } = useListFeedback();
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
  const handleOpenPrintModal = async (quotationId: string) => {
    const requestId = ++printRequest.current;
    try {
      const res = await getQuotationDetailAction(quotationId);
      if (requestId !== printRequest.current) return;
      if (!res.success || !res.data) throw new Error("Load failed");
      setPrintDetail(res.data);
      setIsPrintModalOpen(true);
    } catch {
      if (requestId === printRequest.current) alert("Không tải được bản in. Vui lòng thử lại.");
    }
  };

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
      className: "bg-slate-800 text-slate-300 border-slate-700",
    },
    PENDING_APPROVAL: {
      label: "Chờ Duyệt",
      icon: AlertTriangle,
      className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    APPROVED: {
      label: "Đã Duyệt",
      icon: CheckCircle2,
      className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    REJECTED: {
      label: "Từ Chối",
      icon: XCircle,
      className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    },
  };

  const regionOptions = [{ id: "ALL", name: "Tất cả phân vùng" }, ...regions];
  const pagination = usePagination(quotations.length, JSON.stringify([statusFilter, regionFilter, searchTerm]));

  return (
    <div className="space-y-4 font-sans text-slate-200">
      <PageHeader title="Báo giá" actions={<><RefreshButton onClick={loadQuotations} loading={loading} /><Link href="/quotations/new" className="erp-button bg-blue-600 text-white hover:bg-blue-500"><PlusCircle className="h-4 w-4" />Lập báo giá</Link></>} />

      {/* Multi-Filter & Search Bar */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
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
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
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
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm số báo giá, khách hàng..." aria-label="Tìm số báo giá, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
            >
              Tìm
            </button>
          </form>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Bảng dữ liệu">
          <table className="erp-table w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading || loadError ? <TableFeedback columns={10} loading={loading} error={loadError} onRetry={loadQuotations} /> : quotations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    Không tìm thấy hồ sơ báo giá phù hợp.
                  </td>
                </tr>
              ) : (
                quotations.slice(pagination.start, pagination.end).map((q) => {
                  const badge = statusBadges[q.status] || { label: q.status, icon: Clock, className: "bg-slate-800 text-slate-300 border-slate-700" };
                  const Icon = badge.icon;
                  const isSelected = selectedQuotationId === q.quotationId && isDrawerOpen;

                  return (
                    <tr
                      key={q.quotationId}
                      onClick={() => handleOpenDrawer(q.quotationId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-600/10 hover:bg-blue-600/15"
                          : "hover:bg-slate-800/50"
                      }`}
                    >
                      {/* Số Báo Giá */}
                      <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                        <span className="text-blue-400 hover:underline flex items-center gap-1.5">
                          {q.quotationNo}
                          <span className="text-xs px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                            v{q.version}
                          </span>
                        </span>
                      </td>

                      {/* Khách Hàng */}
                      <td className="py-2.5 px-3 font-medium text-slate-200 max-w-[200px] truncate" title={q.customerName}>
                        {q.customerName}
                      </td>

                      {/* Phân Vùng */}
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                        {q.regionName}
                      </td>

                      {/* Tuyến / Thiết Bị */}
                      <td className="py-2.5 px-3 max-w-[190px] truncate text-xs text-slate-400" title={q.routeSummary}>
                        {q.routeSummary ? (
                          <div className="flex items-center gap-1 truncate">
                            <span className="truncate">{q.routeSummary}</span>
                            {q.equipmentType && (
                              <span className="font-mono text-xs px-1 py-0.2 rounded bg-slate-800 text-cyan-400 shrink-0">
                                {q.equipmentType}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Chưa chọn tuyến</span>
                        )}
                      </td>

                      {/* Doanh Thu SELL */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-white whitespace-nowrap">
                        {formatVND(q.totalSellAmount)}
                      </td>

                      {/* Lãi Gộp GP */}
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-medium whitespace-nowrap ${
                          q.estimatedGp >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatVND(q.estimatedGp)}
                      </td>

                      {/* Margin % */}
                      <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            q.estimatedMarginPercent >= 15
                              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                              : q.estimatedMarginPercent >= 5
                              ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                              : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
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
                      <td className="py-2.5 px-3 text-slate-400 text-xs truncate max-w-[130px]" title={q.createdBy}>
                        {q.createdBy}
                      </td>

                      {/* Thao tác */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status === "APPROVED" && (
                            <button
                              onClick={() => handleOpenPrintModal(q.quotationId)}
                              className="px-2 py-1 rounded bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Xuất bảng chào giá thương mại cho khách hàng"
                            >
                              <Printer className="w-3 h-3" />
                              Bản in
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDrawer(q.quotationId)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-0.5 transition-colors"
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
          <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl flex flex-col z-10">
            {/* Drawer Header */}
            <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm text-white">
                      {drawerDetail?.quote.quotationNo || "Chi tiết báo giá"}
                    </span>
                    {drawerDetail && (
                      <span className="text-xs px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        v{drawerDetail.quote.version}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    Chi tiết báo giá
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {drawerDetail && (
                  <Link
                    href={`/quotations/new?id=${drawerDetail.quote.quotationId}`}
                    className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
                  >
                    Mở báo giá
                  </Link>
                )}
                <button
                  onClick={() => { detailRequest.current++; setIsDrawerOpen(false); }}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
              <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Đang tải chi tiết báo giá…
              </div>
            ) : !drawerDetail ? (
              <div className="flex-1 p-8 text-center text-slate-500 text-xs">
                <p role="alert">Không tải được chi tiết báo giá.</p>
                <button type="button" className="erp-button mt-3 border border-slate-700" onClick={() => selectedQuotationId && handleOpenDrawer(selectedQuotationId)}>Thử lại</button>
              </div>
            ) : (
              <div className="flex-1 p-5 space-y-6">
                {/* Status Bar */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Trạng thái Hồ Sơ:</div>
                    <div className="text-xs font-bold text-white mt-0.5 flex items-center gap-1.5">
                      {drawerDetail.quote.status === "APPROVED" && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> ĐÃ PHÊ DUYỆT (IMMUTABLE LOCKED)
                        </span>
                      )}
                      {drawerDetail.quote.status === "PENDING_APPROVAL" && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> CHỜ HỘI ĐỒNG PHÊ DUYỆT
                        </span>
                      )}
                      {drawerDetail.quote.status === "DRAFT" && (
                        <span className="text-slate-300 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-500" /> Bản nháp
                        </span>
                      )}
                      {drawerDetail.quote.status === "REJECTED" && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> ĐÃ TỪ CHỐI (REJECTED)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {drawerDetail.quote.status === "APPROVED" && (
                      <button
                        onClick={() => setIsPrintModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                      >
                        <Printer className="w-3.5 h-3.5" /> Xuất Bảng Giá Khách Hàng
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 1: Customer & Commercial Terms */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    Khách Hàng & Điều Khoản Thương Mại
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block text-xs">Đơn vị khách hàng:</span>
                      <strong className="text-slate-100 font-semibold mt-0.5 block">
                        {drawerDetail.quote.customerName}
                      </strong>
                      {drawerDetail.quote.taxCode && (
                        <span className="text-slate-400 font-mono text-xs block mt-0.5">
                          MST: {drawerDetail.quote.taxCode}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 block text-xs">Phân vùng áp dụng:</span>
                      <strong className="text-slate-100 font-semibold mt-0.5 block">
                        {drawerDetail.quote.regionName}
                      </strong>
                      <span className="text-slate-400 text-xs block mt-0.5">
                        Hạn thanh toán: <strong className="text-slate-200">{drawerDetail.quote.paymentTermsDays} ngày</strong>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-500 block text-xs">Người lập báo giá:</span>
                      <span className="text-slate-300 font-medium text-xs mt-0.5 block">
                        {drawerDetail.quote.createdBy}
                      </span>
                      <span className="text-slate-500 text-xs font-mono block">
                        Ngày tạo: {new Date(drawerDetail.quote.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-500 block text-xs">Người thẩm định duyệt:</span>
                      <span className="text-slate-300 font-medium text-xs mt-0.5 block">
                        {drawerDetail.quote.approvedBy || "Chưa phê duyệt"}
                      </span>
                      {drawerDetail.quote.approvedAt && (
                        <span className="text-emerald-400 text-xs font-mono block">
                          Ngày duyệt: {new Date(drawerDetail.quote.approvedAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: P&L Summary Matrix */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Hiệu Quả Kinh Doanh P&L (Chuẩn VND)
                  </div>
                  <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center font-mono">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/60">
                      <span className="text-xs text-slate-400 block font-sans">Doanh Thu (SELL)</span>
                      <span className="text-xs font-bold text-white mt-1 block">
                        {formatVND(drawerDetail.quote.totalSellAmount)}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-900 border border-slate-800/60">
                      <span className="text-xs text-slate-400 block font-sans">Giá Vốn (BUY)</span>
                      <span className="text-xs font-bold text-amber-400 mt-1 block">
                        {formatVND(drawerDetail.quote.totalEstimatedBuy)}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-900 border border-slate-800/60">
                      <span className="text-xs text-slate-400 block font-sans">Lãi Gộp (GP)</span>
                      <span
                        className={`text-xs font-bold mt-1 block ${
                          drawerDetail.quote.estimatedGp >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatVND(drawerDetail.quote.estimatedGp)}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-900 border border-slate-800/60">
                      <span className="text-xs text-slate-400 block font-sans">Biên Lợi Nhuận</span>
                      <span
                        className={`text-xs font-semibold mt-1 block ${
                          drawerDetail.quote.estimatedMarginPercent >= 15
                            ? "text-emerald-400"
                            : drawerDetail.quote.estimatedMarginPercent >= 5
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {drawerDetail.quote.estimatedMarginPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Service Items & Routes */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      Danh Mục Dịch Vụ Logistics ({drawerDetail.items.length})
                    </span>
                    <span className="text-xs text-slate-500 font-mono">ORDER_SERVICE_ITEMS</span>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Dịch Vụ / Tuyến</th>
                          <th className="py-2 px-2 text-center">Thiết Bị</th>
                          <th className="py-2 px-2 text-center">SL</th>
                          <th className="py-2 px-3 text-right">Giá Bán (SELL)</th>
                          <th className="py-2 px-3 text-right">Giá Mua (BUY)</th>
                          <th className="py-2 px-2 text-center">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {drawerDetail.items.map((it, idx) => (
                          <tr key={it.itemId || idx} className="hover:bg-slate-950/40">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-200">
                                #{idx + 1}. {it.servicePackage}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <span>{it.originName || "Điểm đi"}</span>
                                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                                <span>{it.destinationName || "Điểm đến"}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-xs text-cyan-400">
                              {it.equipmentType}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-xs">
                              {it.plannedQuantity} {it.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                              {formatVND(it.totalSellPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                              {formatVND(it.estimatedBuyAmount)}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-xs">
                              <span
                                className={
                                  it.itemMarginPercent >= 15
                                    ? "text-emerald-400"
                                    : it.itemMarginPercent >= 5
                                    ? "text-amber-400"
                                    : "text-rose-400"
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
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Giá mua đã lưu · Nội bộ
                      </span>
                      <span className="text-xs text-amber-400/80 font-mono">Chỉ đọc</span>
                    </div>

                    <div className="space-y-1.5">
                      {drawerDetail.snapshots.map((s, sIdx) => (
                        <div
                          key={s.snapshotId || sIdx}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{s.vendorName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                              Hiệu lực: {s.validityStart} &rarr; {s.validityEnd}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-amber-400">
                              Đơn giá: {formatVND(s.rateAmountVnd)}
                            </div>
                            {s.originalCurrency !== "VND" && (
                              <div className="text-xs text-slate-500 font-mono">
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
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Nhật Ký Thẩm Định & Phê Duyệt (Audit Trail)
                    </div>

                    <div className="space-y-1.5">
                      {drawerDetail.approvalLogs.map((log) => (
                        <div
                          key={log.logId}
                          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-1.5 py-0.2 rounded font-mono font-bold ${
                                  log.action === "APPROVED"
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : log.action === "REJECTED"
                                    ? "bg-rose-500/15 text-rose-300"
                                    : "bg-blue-500/15 text-blue-300"
                                }`}
                              >
                                {log.action}
                              </span>
                              <span className="font-semibold text-slate-200">
                                {log.actorName || log.actorId}
                              </span>
                            </div>
                            {log.comment && (
                              <p className="text-xs text-slate-400 mt-1 italic">
                                &ldquo;{log.comment}&rdquo;
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs text-slate-500 font-mono block">
                              {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                            {log.snapshotMarginPercent != null && (
                              <span className="text-xs text-slate-400 font-mono block">
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
              <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0 flex items-center justify-between gap-2">
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Chờ thẩm định
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReturnToDraftFromDrawer}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Trả về nháp
                  </button>
                  <button
                    onClick={handleRejectFromDrawer}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ Chối
                  </button>
                  <button
                    onClick={handleApproveFromDrawer}
                    disabled={isPending}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
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
      {/* MODAL XUẤT BẢNG GIÁ KHÁCH HÀNG (CUSTOMER QUOTATION SHEET) */}
      {/* ==================================================================== */}
      {isPrintModalOpen && printDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Bản in Báo Giá Thương Mại (Customer Quotation Sheet)
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  Đã khóa giá (Bảo mật: Ẩn giá BUY nội bộ)
                </span>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Khung tài liệu thương mại in được */}
            <div id="printable-quotation" className="bg-white text-slate-900 p-8 rounded-xl space-y-6 shadow-inner font-sans">
              {/* Tiêu đề & Logo công ty */}
              <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4">
                <div>
                  <div className="text-xl font-extrabold text-blue-950 tracking-wider">
                    CÔNG TY CỔ PHẦN THILOGI
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    Tập đoàn Logistics THACO Chu Lai • Chu Lai Open Economic Zone, Núi Thành, Quảng Nam
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Hotline: (+84) 235 3567 888 • Email: commercial@thilogi.vn • Web: www.thilogi.vn
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-blue-900">
                    BẢNG CHÀO GIÁ DỊCH VỤ
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                    Số: {printDetail.quote.quotationNo}
                  </div>
                  <div className="text-xs text-slate-500">
                    Ngày phát hành: {new Date(printDetail.quote.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>

              {/* Thông tin Khách hàng */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <div className="text-slate-500">Đơn vị tiếp nhận (Khách hàng):</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {printDetail.quote.customerName}
                  </div>
                  {printDetail.quote.taxCode && (
                    <div className="text-slate-600 mt-1">
                      Mã số thuế: <span className="font-mono font-semibold">{printDetail.quote.taxCode}</span>
                    </div>
                  )}
                  <div className="text-slate-600 mt-0.5">
                    Phân vùng áp dụng: <span className="font-semibold">{printDetail.quote.regionName}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Điều khoản thương mại:</div>
                  <div className="text-slate-700 mt-0.5">
                    Thời hạn công nợ thanh toán: <span className="font-bold text-slate-900">{printDetail.quote.paymentTermsDays} ngày</span>
                  </div>
                  <div className="text-slate-700 mt-0.5">
                    Người phụ trách: <span className="font-semibold">{printDetail.quote.createdBy}</span>
                  </div>
                  {printDetail.quote.approvedBy && (
                    <div className="text-emerald-700 mt-0.5 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Phê duyệt thẩm định bởi: {printDetail.quote.approvedBy}
                    </div>
                  )}
                </div>
              </div>

              {/* Bảng Dịch Vụ và Đơn Giá Bán (Hoàn toàn không có BUY Rate & Margin) */}
              <div>
                <table className="w-full text-left text-xs border-collapse border border-slate-200">
                  <thead className="bg-blue-950 text-white text-xs">
                    <tr>
                      <th className="py-2.5 px-3 border border-blue-900 text-center w-10">STT</th>
                      <th className="py-2.5 px-3 border border-blue-900">Dịch Vụ Logistics</th>
                      <th className="py-2.5 px-3 border border-blue-900">Hành Trình / Phạm Vi</th>
                      <th className="py-2.5 px-3 border border-blue-900">Thiết bị</th>
                      <th className="py-2.5 px-3 border border-blue-900 text-center">ĐVT</th>
                      <th className="py-2.5 px-3 border border-blue-900 text-center">Số Lượng</th>
                      <th className="py-2.5 px-3 border border-blue-900 text-right">Đơn Giá Bán (VND)</th>
                      <th className="py-2.5 px-3 border border-blue-900 text-right">Thành Tiền (VND)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {printDetail.items.map((it, idx) => (
                      <tr key={it.itemId || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 border border-slate-200 text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 font-semibold text-blue-900">
                          {it.servicePackage}
                        </td>
                        <td className="py-2 px-3 border border-slate-200">
                          {it.originName || "Điểm đi"} &rarr; {it.destinationName || "Điểm đến"}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 font-mono">
                          {it.equipmentType}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-center">
                          {it.unit}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-center font-mono font-semibold">
                          {it.plannedQuantity}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right font-mono">
                          {formatVND(Number(it.unitSellPrice))}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right font-mono font-bold text-slate-900">
                          {formatVND(Number(it.totalSellPrice))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={7} className="py-3 px-4 border border-slate-200 text-right uppercase text-xs">
                        Tổng Giá Trị Chào Giá (Chưa gồm VAT):
                      </td>
                      <td className="py-3 px-3 border border-slate-200 text-right font-mono text-sm text-blue-950">
                        {formatVND(Number(printDetail.quote.totalSellAmount))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Điều khoản ghi chú */}
              <div className="text-xs text-slate-600 space-y-1 border-t border-slate-200 pt-3">
                <div className="font-bold text-slate-800">Ghi chú & Điều kiện áp dụng:</div>
                <div>1. Đơn giá trên chưa bao gồm thuế giá trị gia tăng (VAT) theo luật định.</div>
                <div>2. Đơn giá có hiệu lực trong vòng 30 ngày kể từ ngày phát hành báo giá.</div>
                <div>3. Dịch vụ được cung cấp theo quy chuẩn vận hành và kiểm soát an toàn của THILOGI.</div>
              </div>

              {/* Đại diện ký tên */}
              <div className="grid grid-cols-2 pt-6 text-center text-xs">
                <div>
                  <div className="font-bold text-slate-800 uppercase">Đại Diện Khách Hàng</div>
                  <div className="text-xs text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên và đóng dấu)</div>
                  <div className="h-16" />
                </div>
                <div>
                  <div className="font-bold text-blue-950 uppercase">Đại Diện THILOGI Logistics</div>
                  <div className="text-xs text-slate-500 italic mt-0.5">Phòng Định Giá & Phát Triển Thương Mại</div>
                  <div className="h-16" />
                  <div className="font-semibold text-slate-800">{printDetail.quote.approvedBy || printDetail.quote.createdBy}</div>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Printer className="w-4 h-4" />
                In Báo Giá / Lưu PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
