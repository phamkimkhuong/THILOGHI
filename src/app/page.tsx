"use client";

import { useState } from "react";
import {
  Truck,
  Ship,
  Anchor,
  FileText,
  Warehouse,
  ShieldCheck,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Clock,
  CheckCircle2,
  Search,
  PlusCircle,
  BarChart3,
  Building2,
  MapPin,
  HelpCircle,
  Phone,
  Mail,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "workflow">("overview");

  const kpis = [
    { title: "Báo Giá Chờ Phê Duyệt", value: "08", unit: "hồ sơ", change: "+2 hôm nay", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { title: "Đơn Hàng Đang Vận Hành", value: "34", unit: "đơn hàng", change: "100% P&L chuẩn VND", icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Chuyến Xe Đang Chạy", value: "112", unit: "chuyến", change: "Việt Nam - Lào - Campuchia", icon: Truck, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { title: "Yêu Cầu Vận Tải Biển", value: "19", unit: "lô hàng", change: "POL Chu Lai / Tiên Sa", icon: Ship, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  ];

  const services = [
    { code: "TRUCKING", name: "Vận tải Đường bộ", icon: Truck, desc: "Đội xe đầu kéo, moóc cont lạnh, cont tiêu chuẩn chạy nội địa & xuyên biên giới" },
    { code: "OCEAN", name: "Vận tải Đường biển", icon: Ship, desc: "Dịch vụ vận chuyển container quốc tế FCL/LCL kết nối Cảng Chu Lai & các tuyến biển" },
    { code: "PORT", name: "Dịch vụ Cảng & Depot", icon: Anchor, desc: "Tác nghiệp xếp dỡ LOLO, đảo chuyển container, bãi lưu cont và cắm điện lạnh" },
    { code: "CUSTOMS", name: "Thủ tục Hải quan", icon: FileText, desc: "Khai báo hải quan điện tử, luồng tờ khai XNK kinh doanh, gia công, tạm nhập, quá cảnh" },
    { code: "BORDER_GATE", name: "Hiện trường Cửa khẩu", icon: Layers, desc: "Tác nghiệp bãi giám sát cửa khẩu Bờ Y, Nam Giang, Lao Bảo: sang xe, hạ bãi, cân tải" },
    { code: "WAREHOUSING", name: "Dịch vụ Kho bãi", icon: Warehouse, desc: "Hệ thống kho nông sản, kho ngoại quan, kho tổng hợp và dịch vụ đóng rút hàng" },
    { code: "INSURANCE", name: "Bảo hiểm Hàng hóa", icon: ShieldCheck, desc: "Bảo hiểm mọi rủi ro hàng hóa xuất nhập khẩu, kiểm soát mức khấu trừ và phí tối thiểu" },
    { code: "OTHER", name: "Dịch vụ Bổ trợ Đặc thù", icon: FileCheck, desc: "Kiểm dịch thực vật, hun trùng, cấp C/O xuất xứ và các dịch vụ hiện trường chuyên trách" },
  ];

  const workflowSteps = [
    { step: "01", name: "Tiếp Nhận Nhu Cầu", role: "Sales", desc: "Tạo Báo giá Nháp (Draft), chọn Khách hàng, Tuyến vận chuyển và Danh mục dịch vụ" },
    { step: "02", name: "Tra Cứu Giá Mua (BUY)", role: "Pricing", desc: "Tự động truy xuất Thư viện giá NCC hợp lệ, kiểm tra trùng lặp và tính Worst-case BUY" },
    { step: "03", name: "Cấu Thành Giá Bán (SELL)", role: "Sales/Pricing", desc: "Xác định giá bán, tự động tính Gross Profit (GP) và đối chiếu chính sách Margin" },
    { step: "04", name: "Thẩm Định & Khóa Giá", role: "Manager", desc: "Phê duyệt theo phân vùng (Region Scope), kích hoạt cơ chế Khóa Bất Biến (Immutable)" },
    { step: "05", name: "Khởi Tạo Đơn Hàng (Order)", role: "Commercial", desc: "Chuyển đổi Báo giá đã duyệt sang Order - Trung tâm hạch toán P&L độc lập bằng VND" },
    { step: "06", name: "Bàn Giao Vận Hành", role: "Dispatch", desc: "Phát hành Lệnh điều xe (Shipping Order) theo từng đợt (hỗ trợ Partial Release)" },
    { step: "07", name: "Điều Hành & Bàn Giao", role: "Operations", desc: "Điều phối xe, giám sát cửa khẩu/cảng và ghi nhận xử lý các sự cố ngoại lệ phát sinh" },
    { step: "08", name: "Xác Minh Bộ Chứng Từ", role: "Docs", desc: "Kiểm tra Checklist: Biên bản giao hàng (Delivery Proof), Tờ khai hải quan thông quan, Bill gốc" },
    { step: "09", name: "Tập Hợp Chi Phí Thực Tế", role: "Accounting", desc: "Ghi nhận Actual Costs, bổ chi phí NCC dùng chung và đối soát hóa đơn AR/AP" },
    { step: "10", name: "Khóa Sổ 2 Giai Đoạn", role: "Finance", desc: "Đóng Vận hành (Operationally Closed) và Đóng Tài chính (Financially Closed - UAT-12)" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {/* Top Enterprise Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-xl tracking-wider shadow-md shadow-blue-600/30">
              TL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">THILOGI</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Logistics Operating Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Tập đoàn Logistics Chu Lai (THACO Group)</p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Tra Cứu Bảng Giá Mua
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all">
              <PlusCircle className="w-3.5 h-3.5" />
              Lập Báo Giá Mới
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 flex flex-col gap-8 w-full">
        {/* Banner Chào Mừng Vận Hành */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border border-slate-800 p-8 shadow-xl">
          <div className="max-w-3xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Hệ Thống Quản Trị Vận Hành Vận Tải Đa Phương Thức Xuyên Biên Giới
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Trung Tâm Điều Hành & Quản Trị Báo Giá <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">THILOGI</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Quản trị tập trung toàn chuỗi cung ứng: Từ tiếp nhận nhu cầu, tính toán giá thành BUY/SELL, kiểm soát biên lợi nhuận gộp (P&L VND), điều phối đoàn xe đường bộ đến thủ tục cảng biển và cửa khẩu quốc tế.
            </p>
          </div>
        </div>

        {/* Operational KPIs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Chỉ Số Tác Nghiệp Thời Gian Thực
            </h2>
            <span className="text-xs text-slate-400">Đồng bộ dữ liệu vận hành</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.title}
                  className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center border ${kpi.border}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white tracking-tight">{kpi.value}</span>
                      <span className="text-xs text-slate-400 font-medium">{kpi.unit}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {kpi.change}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8 Gói Dịch Vụ Chuẩn Hóa */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Danh Mục 8 Gói Dịch Vụ Chuỗi Cung Ứng
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Cấu thành chuỗi logistics trọn gói theo từng hợp đồng khách hàng</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <div
                  key={svc.code}
                  className="bg-slate-900/40 hover:bg-slate-900/90 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 font-semibold mb-0.5">{svc.code}</div>
                    <div className="font-bold text-sm text-white mb-1.5">{svc.name}</div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{svc.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quy Trình Vận Hành Lõi 10 Bước */}
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Quy Trình Nghiệp Vụ Chuẩn Hóa End-to-End (10 Bước)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Từ khâu tiếp nhận nhu cầu thương mại đến điều hành thực địa và khóa sổ tài chính</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {workflowSteps.map((s) => (
              <div
                key={s.step}
                className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 hover:border-blue-500/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-cyan-400">BƯỚC {s.step}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {s.role}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-white mb-1.5">{s.name}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Enterprise Production Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="font-semibold text-slate-200">
              TẬP ĐOÀN LOGISTICS CHU LAI (THILOGI) • THACO GROUP
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <MapPin className="w-3 h-3 text-slate-400" />
              Khu Kinh Tế Mở Chu Lai, Xã Tam Hiệp, Huyện Núi Thành, Tỉnh Quảng Nam
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>Tổng đài: (0235) 3567 888</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hỗ trợ: support@thilogi.vn</span>
            </div>
            <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              Phiên bản: R1.0.0 (Core Loop)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
