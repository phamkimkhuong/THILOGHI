"use client";

import { useState, useActionState } from "react";
import { loginAction } from "@/features/auth/actions";
import {
  Truck,
  Anchor,
  TrendingUp,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Building2,
  Boxes,
} from "lucide-react";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* CỘT TRÁI: SHOWCASE HỆ SINH THÁI LOGISTICS & THƯƠNG HIỆU THILOGI (TÔNG XANH DOANH NGHIỆP TƯƠI SÁNG) */}
      <div className="hidden lg:flex lg:w-7/12 xl:w-2/3 flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white shadow-2xl">
        {/* Hiệu ứng ánh sáng xanh dương & họa tiết lưới tinh tế */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-wider text-white">THILOGI</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white border border-white/30">
                THACO GROUP
              </span>
            </div>
            <p className="text-xs text-blue-100 font-medium tracking-wide">
              Tập đoàn Logistics Chu Lai • Chu Lai International Logistics Hub
            </p>
          </div>
        </div>

        {/* Hero Pitch */}
        <div className="relative z-10 my-auto py-8 max-w-2xl space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/50 border border-white/25 text-white text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Nền tảng Quản trị Vận hành Logistics Tích hợp • Release 1
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Số hóa toàn diện chuỗi cung ứng liên vận & Quản trị Báo giá P&L
            </h1>
            <p className="text-blue-100 text-sm xl:text-base leading-relaxed">
              Mô hình khép kín kết nối Cảng Quốc tế Chu Lai, đội xe đầu kéo đường bộ xuyên biên giới 
              <strong className="text-white font-bold"> Việt Nam – Nam Lào – Bắc Campuchia</strong>, hệ thống bãi Depot 
              và động cơ định giá tối ưu lợi nhuận thời gian thực.
            </p>
          </div>

          {/* 4 Trụ cột Vận hành (Thẻ kính sáng nổi bật) */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/15 transition-all shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white mb-2.5 shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Vận tải Đường bộ Liên vận</h3>
              <p className="text-xs text-blue-100/90 leading-normal">
                Đội xe cont bạt, cont lạnh kết nối các cửa khẩu Bờ Y, Nam Giang, Lao Bảo.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/15 transition-all shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white mb-2.5 shadow-xs">
                <Anchor className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Cảng Biển & Kho Bãi</h3>
              <p className="text-xs text-blue-100/90 leading-normal">
                Nâng hạ LOLO, bãi lưu cont, kho nông sản xuất nhập khẩu Cảng Chu Lai.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/15 transition-all shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white mb-2.5 shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Động cơ Báo giá P&L</h3>
              <p className="text-xs text-blue-100/90 leading-normal">
                So sánh giá mua NCC, tính toán chi phí worst-case và duyệt báo giá đa cấp.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/15 transition-all shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white mb-2.5 shadow-xs">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Khóa Bất biến Kế toán</h3>
              <p className="text-xs text-blue-100/90 leading-normal">
                Bảo vệ toàn vẹn dữ liệu hợp đồng thương mại, ngăn ngừa trôi lệch tỷ giá.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-blue-200/90 pt-5 border-t border-white/15">
          <p>© 2026 THILOGI Logistics. Bản quyền thuộc Tập đoàn THACO.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Hệ thống bảo mật nội bộ</span>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: KHU VỰC ĐĂNG NHẬP (TÔNG SÁNG TRẮNG TINH KHÔI, DỄ ĐỌC, TƯƠNG PHẢN CAO) */}
      <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-white lg:bg-slate-50/70 border-l border-slate-200">
        <div className="w-full max-w-sm space-y-7" suppressHydrationWarning>
          {/* Header trên Mobile */}
          <div className="lg:hidden flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">THILOGI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                  THACO
                </span>
              </div>
              <p className="text-xs text-slate-500">Hệ thống Quản trị Báo giá Logistics</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5 text-left">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              Cổng Đăng Nhập Nội Bộ
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Đăng nhập</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Vui lòng nhập tài khoản nhân sự được cấp để tiếp tục.
            </p>
          </div>

          {/* Login Form */}
          <form action={action} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tên đăng nhập / Mã nhân sự
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  maxLength={100}
                  placeholder="Nhập mã nhân sự (VD: 1412113, NV0001...)"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-mono shadow-xs"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Mật khẩu</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={72}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-600 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {state?.error && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium leading-relaxed">{state.error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {pending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực tài khoản…</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập vào Hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Audit Notice (Giao diện sáng sủa, thanh lịch) */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/60 flex items-center gap-2.5 text-blue-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">Mã hóa SSL 256-bit • Kết nối CSDL THILOGI Production</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed text-center sm:text-left">
              Hệ thống bảo mật nội bộ THILOGI. Mọi phiên đăng nhập và nghiệp vụ định giá đều được lưu vết trong Nhật ký Kiểm toán (Audit Trail).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
