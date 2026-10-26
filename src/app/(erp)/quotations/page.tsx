"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
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
} from "lucide-react";
import {
  getQuotationsListAction,
  getQuotationDetailAction,
} from "@/features/quotation/actions";
import { QuotationListItem } from "@/server/modules/quotation/quotation.service";

interface QuotationDetailData {
  quote: {
    quotationId: string;
    quotationNo: string;
    version: number;
    customerId: string;
    customerName: string;
    taxCode?: string;
    regionId: string;
    regionName: string;
    commodityName?: string;
    status: string;
    totalSellAmount: string | number;
    paymentTermsDays: number;
    createdBy: string;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
  };
  items: Array<{
    itemId: string;
    servicePackage: string;
    originName?: string;
    destinationName?: string;
    equipmentType: string;
    plannedQuantity: string | number;
    unit: string;
    unitSellPrice: string | number;
    totalSellPrice: string | number;
  }>;
}

export default function QuotationListPage() {
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailData, setDetailData] = useState<QuotationDetailData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadQuotations = useCallback(() => {
    startTransition(async () => {
      const res = await getQuotationsListAction({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchTerm || undefined,
      });
      if (res.success) {
        setQuotations(res.data);
      }
    });
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuotations();
  };

  const handleOpenCustomerSheet = (quotationId: string) => {
    startTransition(async () => {
      const res = await getQuotationDetailAction(quotationId);
      if (res.success && res.data) {
        setDetailData(res.data as unknown as QuotationDetailData);
        setIsDetailOpen(true);
      }
    });
  };

  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  // Thống kê nhanh KPI
  const stats = {
    total: quotations.length,
    pending: quotations.filter((q) => q.status === "PENDING_APPROVAL").length,
    approved: quotations.filter((q) => q.status === "APPROVED").length,
    draft: quotations.filter((q) => q.status === "DRAFT").length,
  };

  const statusBadges: Record<string, { label: string; icon: typeof Clock; className: string }> = {
    DRAFT: {
      label: "Bản Nháp",
      icon: Clock,
      className: "bg-slate-800 text-slate-300 border-slate-700",
    },
    PENDING_APPROVAL: {
      label: "Chờ Phê Duyệt",
      icon: AlertTriangle,
      className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    APPROVED: {
      label: "Đã Phê Duyệt",
      icon: CheckCircle2,
      className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    REJECTED: {
      label: "Từ Chối",
      icon: XCircle,
      className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Quotation Management Hub
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Danh Sách Báo Giá Thương Mại
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý vòng đời báo giá, thẩm định P&L chuẩn VND và phát hành bảng chào giá chính thức cho khách hàng
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadQuotations}
            disabled={isPending}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <Link
            href="/quotations/new"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            Tạo Báo Giá Mới
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Tổng số Báo giá</div>
          <div className="text-2xl font-extrabold text-white mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Hồ sơ trong hệ thống</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Chờ Phê Duyệt
          </div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">{stats.pending}</div>
          <div className="text-[11px] text-amber-400/70 mt-0.5">Approval Worklist</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Phê Duyệt
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 mt-1">{stats.approved}</div>
          <div className="text-[11px] text-emerald-400/70 mt-0.5">Sẵn sàng xuất khách hàng</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Bản Nháp (Draft)</div>
          <div className="text-2xl font-extrabold text-slate-200 mt-1">{stats.draft}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Đang cấu thành giá bán</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "PENDING_APPROVAL", label: "Chờ phê duyệt" },
            { id: "APPROVED", label: "Đã phê duyệt" },
            { id: "DRAFT", label: "Bản nháp" },
            { id: "REJECTED", label: "Từ chối" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm số báo giá, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* Quotations Data Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Số Báo Giá</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Phân Vùng</th>
                <th className="py-3 px-4 text-right">Doanh Thu (SELL)</th>
                <th className="py-3 px-4 text-right">Lãi Gộp (GP)</th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4">Người Tạo</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                    {isPending ? "Đang tải dữ liệu từ CSDL..." : "Chưa có báo giá nào trong cơ sở dữ liệu."}
                  </td>
                </tr>
              ) : (
                quotations.map((q) => {
                  const badge = statusBadges[q.status] || statusBadges.DRAFT;
                  const Icon = badge.icon;
                  return (
                    <tr
                      key={q.quotationId}
                      className="hover:bg-slate-800/40 transition-colors font-sans"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        <Link
                          href={`/quotations/new?id=${q.quotationId}`}
                          className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                        >
                          {q.quotationNo}
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                            v{q.version}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200 max-w-[200px] truncate">
                        {q.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {q.regionName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                        {formatVND(q.totalSellAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-medium">
                        {formatVND(q.estimatedGp)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            q.estimatedMarginPercent >= 15
                              ? "text-emerald-400 bg-emerald-500/10"
                              : q.estimatedMarginPercent >= 5
                              ? "text-amber-400 bg-amber-500/10"
                              : "text-rose-400 bg-rose-500/10"
                          }`}
                        >
                          {q.estimatedMarginPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.className}`}
                        >
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs truncate max-w-[140px]">
                        {q.createdBy}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status === "APPROVED" && (
                            <button
                              onClick={() => handleOpenCustomerSheet(q.quotationId)}
                              className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                              title="Xuất bảng chào giá thương mại cho khách hàng (ẩn giá BUY nội bộ)"
                            >
                              <Printer className="w-3 h-3" />
                              Xuất Báo Giá
                            </button>
                          )}
                          <Link
                            href={`/quotations/new?id=${q.quotationId}`}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-0.5 transition-colors"
                          >
                            Xem <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xuất Báo Giá Khách Hàng (Commercial Quotation Sheet) */}
      {isDetailOpen && detailData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Bản In Báo Giá Thương Mại (Customer Quotation Sheet)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  Đã khóa giá (Bảo mật: Ẩn giá BUY nội bộ)
                </span>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
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
                  <div className="text-base font-black text-blue-900">
                    BẢNG CHÀO GIÁ DỊCH VỤ
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                    Số: {detailData.quote.quotationNo}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ngày phát hành: {new Date(detailData.quote.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>

              {/* Thông tin Khách hàng */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <div className="text-slate-500">Đơn vị tiếp nhận (Khách hàng):</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {detailData.quote.customerName}
                  </div>
                  {detailData.quote.taxCode && (
                    <div className="text-slate-600 mt-1">
                      Mã số thuế: <span className="font-mono font-semibold">{detailData.quote.taxCode}</span>
                    </div>
                  )}
                  <div className="text-slate-600 mt-0.5">
                    Phân vùng áp dụng: <span className="font-semibold">{detailData.quote.regionName}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Điều khoản thương mại:</div>
                  <div className="text-slate-700 mt-0.5">
                    Thời hạn công nợ thanh toán: <span className="font-bold text-slate-900">{detailData.quote.paymentTermsDays} ngày</span>
                  </div>
                  <div className="text-slate-700 mt-0.5">
                    Người phụ trách: <span className="font-semibold">{detailData.quote.createdBy}</span>
                  </div>
                  {detailData.quote.approvedBy && (
                    <div className="text-emerald-700 mt-0.5 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Phê duyệt thẩm định bởi: {detailData.quote.approvedBy}
                    </div>
                  )}
                </div>
              </div>

              {/* Bảng Dịch Vụ và Đơn Giá Bán (Hoàn toàn không có BUY Rate & Margin) */}
              <div>
                <table className="w-full text-left text-xs border-collapse border border-slate-200">
                  <thead className="bg-blue-950 text-white text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 border border-blue-900 text-center w-10">STT</th>
                      <th className="py-2.5 px-3 border border-blue-900">Dịch Vụ Logistics</th>
                      <th className="py-2.5 px-3 border border-blue-900">Hành Trình / Phạm Vi</th>
                      <th className="py-2.5 px-3 border border-blue-900">Loại Thiết Bị</th>
                      <th className="py-2.5 px-3 border border-blue-900 text-center">ĐVT</th>
                      <th className="py-2.5 px-3 border border-blue-900 text-center">Số Lượng</th>
                      <th className="py-2.5 px-3 border border-blue-900 text-right">Đơn Giá Bán (VND)</th>
                      <th className="py-2.5 px-3 border border-blue-900 text-right">Thành Tiền (VND)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {detailData.items.map((it, idx) => (
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
                        {formatVND(Number(detailData.quote.totalSellAmount))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Điều khoản ghi chú */}
              <div className="text-[11px] text-slate-600 space-y-1 border-t border-slate-200 pt-3">
                <div className="font-bold text-slate-800">Ghi chú & Điều kiện áp dụng:</div>
                <div>1. Đơn giá trên chưa bao gồm thuế giá trị gia tăng (VAT) theo luật định.</div>
                <div>2. Đơn giá có hiệu lực trong vòng 30 ngày kể từ ngày phát hành báo giá.</div>
                <div>3. Dịch vụ được cung cấp theo quy chuẩn vận hành và kiểm soát an toàn của THILOGI.</div>
              </div>

              {/* Đại diện ký tên */}
              <div className="grid grid-cols-2 pt-6 text-center text-xs">
                <div>
                  <div className="font-bold text-slate-800 uppercase">Đại Diện Khách Hàng</div>
                  <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên và đóng dấu)</div>
                  <div className="h-16" />
                </div>
                <div>
                  <div className="font-bold text-blue-950 uppercase">Đại Diện THILOGI Logistics</div>
                  <div className="text-[11px] text-slate-500 italic mt-0.5">Phòng Định Giá & Phát Triển Thương Mại</div>
                  <div className="h-16" />
                  <div className="font-semibold text-slate-800">{detailData.quote.approvedBy || detailData.quote.createdBy}</div>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDetailOpen(false)}
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
