"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, Printer, ArrowLeft } from "lucide-react";
import { getCommercialSheetAction } from "@/features/quotation/phase4-actions";
import { exportQuotationToExcel } from "@/shared/utils/excel";
import { useDocumentTitle } from "@/shared/hooks/use-document-title";
import { PrintSkeleton } from "@/components/ui/print-skeleton";

const money = (n: number) => new Intl.NumberFormat("vi-VN",{maximumFractionDigits:0}).format(n);
const inclusions: Record<string,string> = {INCLUDED:"Trong giá chào",SEPARATELY_BILLED:"Thu riêng",PASS_THROUGH_ACTUAL:"Thu theo thực tế · tạm tính"};
const serviceLabels: Record<string,string> = {
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
  const [result,setResult] = useState<Awaited<ReturnType<typeof getCommercialSheetAction>> | null>(null);
  const [retry,setRetry] = useState(0);
  useDocumentTitle(result?.success ? `Bản in Báo giá ${result.sheet.quotationNo}` : "Bản in Báo giá");
  useEffect(()=>{
    let current=true;
    const timer=setTimeout(()=>{
    setResult(null);
    if (!id) { setResult({success:false,error:"Thiếu mã báo giá."}); return; }
    void getCommercialSheetAction(id).then(r=>{if(current)setResult(r);}).catch(()=>{if(current)setResult({success:false,error:"Không tải được bản in. Vui lòng thử lại."});});
    },0);
    return ()=>{current=false;clearTimeout(timer);};
  },[id,retry]);
  if (!result) return <PrintSkeleton />;
  if (!result.success) return <div role="alert" className="space-y-3"><p>{result.error}</p><button className="erp-button" onClick={()=>setRetry(n=>n+1)}>Thử lại</button><Link className="erp-button" href="/quotations">Danh sách báo giá</Link></div>;
  const {sheet} = result;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link className="erp-button border border-border bg-surface text-foreground hover:bg-surface-hover inline-flex items-center gap-1.5" href="/quotations">
        <ArrowLeft className="w-4 h-4" /> Danh sách báo giá
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <Link className="erp-button border border-border bg-surface text-foreground hover:bg-surface-hover" href={`/quotations/new?id=${id}`}>
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
        <button type="button" className="erp-button bg-primary text-white hover:bg-primary-hover shadow-xs font-bold inline-flex items-center gap-1.5" onClick={()=>window.print()}>
          <Printer className="w-4 h-4" /> In / Lưu PDF
        </button>
      </div>
    </div>
    <article id="customer-quotation-print" className="rounded-lg bg-white p-5 text-slate-950 sm:p-8 space-y-6">
      <header className="flex flex-wrap justify-between gap-3 border-b pb-4"><div><h1 className="text-2xl font-bold">THILOGI · BÁO GIÁ DỊCH VỤ</h1><p>{sheet.quotationNo} · Phiên bản {sheet.version}</p></div><p>Ngày duyệt: {result.approvedAt ? new Date(result.approvedAt).toLocaleDateString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"}) : "—"}</p></header>
      {result.superseded && <p className="border-2 border-red-700 p-3 font-bold text-red-800">BẢN LƯU TRỮ — ĐÃ ĐƯỢC THAY THẾ BỞI PHIÊN BẢN MỚI</p>}
      <section><h2 className="font-bold">Kính gửi: {sheet.customerName}</h2>{sheet.taxCode && <p>Mã số thuế: {sheet.taxCode}</p>}{sheet.address && <p>Địa chỉ: {sheet.address}</p>}{sheet.commodity && <p>Hàng hóa: {sheet.commodity}</p>}<p>Hạn thanh toán: {sheet.paymentTermsDays} ngày</p></section>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr>{["STT","Dịch vụ / tuyến","Thiết bị","Số lượng","Đơn vị","Đơn giá","Thành tiền","Cách thu"].map(h=><th key={h} className="border border-slate-400 p-2 text-left">{h}</th>)}</tr></thead><tbody>{sheet.items.map((i,n)=><tr key={n}><td className="border border-slate-400 p-2">{n+1}</td><td className="border border-slate-400 p-2">{serviceLabels[i.service] ?? i.service}<br />{i.origin} → {i.destination}</td><td className="border border-slate-400 p-2">{i.equipment}</td><td className="border border-slate-400 p-2">{i.quantity}</td><td className="border border-slate-400 p-2">{i.unit}</td><td className="border border-slate-400 p-2 text-right">{money(i.unitPrice)}</td><td className="border border-slate-400 p-2 text-right">{money(i.amount)}</td><td className="border border-slate-400 p-2">{inclusions[i.inclusion] ?? i.inclusion}</td></tr>)}</tbody><tfoot><tr><th colSpan={6} className="border border-slate-400 p-2 text-right">Tổng giá trị chào / tạm tính ({sheet.currency})</th><td colSpan={2} className="border border-slate-400 p-2 font-bold">{money(sheet.totalSellAmount)}</td></tr></tfoot></table></div>
      {sheet.items.some(i=>i.inclusion!=="INCLUDED") && <p className="text-sm">Các khoản thu riêng và thu theo thực tế được liệt kê ở từng dòng; khoản thu theo thực tế là giá trị tạm tính.</p>}
    </article>
  </div>;
}
export default function QuotationPrintPage() {
  return (
    <Suspense fallback={<PrintSkeleton />}>
      <PrintSheet />
    </Suspense>
  );
}
