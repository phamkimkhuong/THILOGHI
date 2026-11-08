"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, Printer, ArrowLeft } from "lucide-react";
import { getCommercialSheetAction } from "@/features/quotation/phase4-actions";
import { exportQuotationToExcel } from "@/shared/utils/excel";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { numberToVietnameseWords } from "@/shared/utils/pricing";
import { PrintSkeleton } from "@/components/ui/print-skeleton";

const money = (n: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n);
const inclusions: Record<string, string> = {
  INCLUDED: "Trong giá chào (All-in)",
  SEPARATELY_BILLED: "Thu riêng (Tách dòng)",
  PASS_THROUGH_ACTUAL: "Thu theo thực tế (Tạm tính)",
};
const serviceLabels: Record<string, string> = {
  TRUCKING: "Vận tải đường bộ",
  OCEAN: "Vận tải biển",
  PORT: "Cảng & Depot",
  CUSTOMS: "Hải quan & XNK",
  BORDER_GATE: "Cửa khẩu & Bãi",
  WAREHOUSING: "Kho bãi & Lưu trữ",
  INSURANCE: "Bảo hiểm hàng hóa",
  OTHER: "Dịch vụ khác",
};

function PrintSheet() {
  const id = useSearchParams().get("id");
  const [result, setResult] = useState<Awaited<ReturnType<typeof getCommercialSheetAction>> | null>(null);
  const [retry, setRetry] = useState(0);

  useDocumentTitle(result?.success ? `Bản in Báo giá ${result.sheet.quotationNo}` : "Bản in Báo giá");

  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      setResult(null);
      if (!id) {
        setResult({ success: false, error: "Thiếu mã báo giá." });
        return;
      }
      void getCommercialSheetAction(id)
        .then((r) => {
          if (current) setResult(r);
        })
        .catch(() => {
          if (current) setResult({ success: false, error: "Không tải được bản in. Vui lòng thử lại." });
        });
    }, 0);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [id, retry]);

  if (!result) return <PrintSkeleton />;
  if (!result.success) {
    return (
      <div role="alert" className="space-y-3 p-6 max-w-md mx-auto text-center">
        <p className="text-red-600 font-semibold">{result.error}</p>
        <div className="flex justify-center gap-3">
          <button className="erp-button" onClick={() => setRetry((n) => n + 1)}>
            Thử lại
          </button>
          <Link className="erp-button" href="/quotations">
            Danh sách báo giá
          </Link>
        </div>
      </div>
    );
  }

  const { sheet } = result;

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto print:max-w-none print:m-0">
      {/* Thanh tác vụ điều hướng (Ẩn khi in ấn / xuất PDF) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden bg-surface p-3 rounded-xl border border-border shadow-xs">
        <Link
          className="erp-button border border-border bg-surface text-foreground hover:bg-surface-hover inline-flex items-center gap-1.5 font-medium"
          href="/quotations"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách báo giá
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="erp-button border border-border bg-surface text-foreground hover:bg-surface-hover font-medium"
            href={`/quotations/new?id=${id}`}
          >
            Mở báo giá
          </Link>
          <button
            type="button"
            className="erp-button border border-border bg-surface text-foreground hover:bg-surface-hover shadow-xs font-semibold inline-flex items-center gap-1.5"
            onClick={() => {
              void exportQuotationToExcel({
                quotationNo: sheet.quotationNo,
                version: sheet.version,
                customerName: sheet.customerName,
                taxCode: sheet.taxCode,
                address: sheet.address,
                commodity: sheet.commodity,
                paymentTermsDays: sheet.paymentTermsDays,
                approvedAt: result.approvedAt,
                currency: sheet.currency,
                totalSellAmount: sheet.totalSellAmount,
                items: sheet.items,
              });
            }}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất Excel (.xlsx)
          </button>
          <button
            type="button"
            className="erp-button bg-primary text-white hover:bg-primary-hover shadow-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" /> In / Lưu PDF
          </button>
        </div>
      </div>

      {/* Trang in báo giá chuẩn thương hiệu THILOGI Chu Lai */}
      <article
        id="customer-quotation-print"
        className="rounded-xl bg-white p-6 sm:p-10 text-slate-950 shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 space-y-6"
      >
        {/* 1. Header THILOGI & Mã báo giá */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#102f63] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-[#102f63]">THILOGI</span>
              <span className="text-xs uppercase tracking-widest text-[#2672df] font-bold border-l-2 border-slate-300 pl-2">
                Chu Lai Logistics Hub
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-1 uppercase">
              TỔNG CÔNG TY GIAO NHẬN VẬN TẢI THILOGI
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Khu Kinh tế Mở Chu Lai, Tam Hiệp, Núi Thành, Quảng Nam • Hotline: 1900 5454 • Website: www.thilogi.vn
            </p>
          </div>
          <div className="text-right font-sans">
            <span className="inline-block px-3 py-1 rounded bg-[#102f63] text-white text-xs font-bold uppercase tracking-wider">
              Báo giá thương mại
            </span>
            <p className="font-mono text-sm font-bold text-slate-900 mt-1">
              Số: {sheet.quotationNo}
            </p>
            <p className="text-xs text-slate-600 font-mono">
              Phiên bản: v{sheet.version}
            </p>
          </div>
        </header>

        {/* Cảnh báo nếu phiên bản đã bị thay thế */}
        {result.superseded && (
          <div className="border-2 border-red-600 bg-red-50 p-3 rounded text-center font-bold text-red-800 text-sm">
            ⚠️ BẢN LƯU TRỮ — ĐÃ ĐƯỢC THAY THẾ BỞI PHIÊN BẢN MỚI
          </div>
        )}

        {/* 2. Tiêu đề Báo giá */}
        <div className="text-center py-2 border-b border-slate-200">
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#102f63]">
            BẢNG BÁO GIÁ DỊCH VỤ VẬN TẢI &amp; LOGISTICS
          </h1>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs text-slate-600 mt-1.5 font-sans">
            <span>
              Ngày duyệt:{" "}
              <strong>
                {result.approvedAt
                  ? new Date(result.approvedAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
                  : "—"}
              </strong>
            </span>
            {result.pricingDate && (
              <span>
                • Ngày áp dụng giá: <strong>{result.pricingDate}</strong>
              </span>
            )}
            {result.validUntil && (
              <span>
                • Hiệu lực đến:{" "}
                <strong>
                  {new Date(result.validUntil).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* 3. Khối thông tin khách hàng */}
        <section className="rounded-lg bg-slate-50/80 p-4 border border-slate-200 text-xs text-slate-800 space-y-1.5 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
            <div>
              <p>
                <span className="font-semibold text-slate-600">Kính gửi (Khách hàng): </span>
                <strong className="text-sm font-bold text-slate-900">{sheet.customerName}</strong>
              </p>
              {sheet.taxCode && (
                <p>
                  <span className="font-semibold text-slate-600">Mã số thuế: </span>
                  <span className="font-mono font-medium">{sheet.taxCode}</span>
                </p>
              )}
              {sheet.address && (
                <p>
                  <span className="font-semibold text-slate-600">Địa chỉ: </span>
                  <span>{sheet.address}</span>
                </p>
              )}
            </div>
            <div>
              {sheet.commodity && (
                <p>
                  <span className="font-semibold text-slate-600">Mặt hàng vận chuyển: </span>
                  <strong className="text-slate-900">{sheet.commodity}</strong>
                </p>
              )}
              <p>
                <span className="font-semibold text-slate-600">Hạn thanh toán: </span>
                <span className="font-semibold text-slate-900">{sheet.paymentTermsDays} ngày</span>{" "}
                <span className="text-slate-500">(kể từ ngày nhận đủ hóa đơn và chứng từ hợp lệ)</span>
              </p>
              <p>
                <span className="font-semibold text-slate-600">Đồng tiền thanh toán: </span>
                <span className="font-mono font-bold text-slate-900">{sheet.currency}</span>
              </p>
            </div>
          </div>
        </section>

        {/* 4. Bảng chi tiết đơn giá & thành tiền */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[#102f63] text-white print:bg-[#102f63] print:text-white font-semibold">
                <th className="border border-slate-300 p-2 text-center w-10">STT</th>
                <th className="border border-slate-300 p-2 text-left">Gói dịch vụ &amp; Tuyến / Địa điểm tác nghiệp</th>
                <th className="border border-slate-300 p-2 text-center w-20">Phương tiện</th>
                <th className="border border-slate-300 p-2 text-center w-16">Số lượng</th>
                <th className="border border-slate-300 p-2 text-center w-16">ĐVT</th>
                <th className="border border-slate-300 p-2 text-right w-28">Đơn giá ({sheet.currency})</th>
                <th className="border border-slate-300 p-2 text-right w-32">Thành tiền ({sheet.currency})</th>
                <th className="border border-slate-300 p-2 text-center w-28">Phương thức tính</th>
              </tr>
            </thead>
            <tbody>
              {sheet.items.map((i, n) => {
                const isTransport = i.service === "TRUCKING" || i.service === "OCEAN" || i.service === "BORDER_GATE";
                return (
                  <tr key={n} className={n % 2 === 1 ? "bg-slate-50/70" : ""}>
                    <td className="border border-slate-300 p-2 text-center font-mono">{n + 1}</td>
                    <td className="border border-slate-300 p-2">
                      <strong className="text-slate-900 block">{serviceLabels[i.service] ?? i.service}</strong>
                      {isTransport ? (
                        <span className="text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                          {i.origin} <span className="text-slate-400 font-normal">→</span> {i.destination}
                        </span>
                      ) : (
                        <span className="text-slate-600 mt-0.5 block font-medium">
                          {i.origin}{" "}
                          <span className="text-slate-400 italic text-[11px] font-normal">(Tại cơ sở / Cảng)</span>
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{i.equipment}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono font-medium">{i.quantity}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600">{i.unit}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-medium text-slate-800">
                      {money(i.unitPrice)}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">
                      {money(i.amount)}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-[11px] text-slate-600">
                      {inclusions[i.inclusion] ?? i.inclusion}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={6} className="border border-slate-300 p-2.5 text-right uppercase text-slate-800">
                  Tổng cộng giá trị chào bán ({sheet.currency}):
                </td>
                <td colSpan={2} className="border border-slate-300 p-2.5 font-mono text-base font-extrabold text-[#102f63]">
                  {money(sheet.totalSellAmount)} {sheet.currency}
                </td>
              </tr>
              <tr>
                <td colSpan={8} className="border border-slate-300 p-2.5 bg-slate-50 text-xs italic text-slate-700">
                  <strong>Bằng chữ: </strong> {numberToVietnameseWords(sheet.totalSellAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 5. Ghi chú & Điều khoản thương mại */}
        <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-200 pt-3 font-sans">
          <h3 className="font-bold uppercase text-slate-800 tracking-wider text-[11px]">
            Ghi chú &amp; Điều khoản thương mại:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
            <li>Đơn giá nêu trên chưa bao gồm thuế Giá trị Gia tăng (VAT) theo quy định hiện hành của Nhà nước.</li>
            <li>
              Các khoản chi phí thu hộ hoặc thu theo thực tế (Pass-through / Tạm tính) sẽ được đối soát và quyết toán căn cứ theo hóa đơn, chứng từ hợp lệ của cơ quan chức năng hoặc hãng tàu/cảng.
            </li>
            <li>
              Thời hạn hiệu lực:{" "}
              {result.validUntil
                ? `Đến hết ngày ${new Date(result.validUntil).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`
                : "Trong vòng 30 ngày kể từ ngày duyệt"}{" "}
              trừ khi có thỏa thuận hoặc thông báo điều chỉnh khác bằng văn bản từ THILOGI.
            </li>
            <li>Hàng hóa vận chuyển phải có đầy đủ hóa đơn, chứng từ hợp lệ theo quy định lưu thông hàng hóa của pháp luật Việt Nam.</li>
          </ul>
        </div>

        {/* 6. Đại diện các bên ký xác nhận */}
        <div className="grid grid-cols-2 gap-8 pt-6 pb-6 text-center text-xs text-slate-800 break-inside-avoid">
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-slate-900">ĐẠI DIỆN KHÁCH HÀNG</p>
            <p className="text-[11px] text-slate-500 italic">(Ký, ghi rõ họ tên và đóng dấu)</p>
            <div className="h-24" />
          </div>
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-[#102f63]">ĐẠI DIỆN THILOGI LOGISTICS</p>
            <p className="text-[11px] text-slate-500 italic">
              (Người duyệt: {result.approvedBy || "Ban Giám Đốc Phê Duyệt"})
            </p>
            <div className="h-24" />
            {result.approvedBy && (
              <p className="font-semibold text-slate-900 uppercase text-[11px]">{result.approvedBy}</p>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

export default function QuotationPrintPage() {
  return (
    <Suspense fallback={<PrintSkeleton />}>
      <PrintSheet />
    </Suspense>
  );
}
