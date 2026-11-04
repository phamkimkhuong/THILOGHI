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
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f5f8fc] text-[#16254a] font-sans selection:bg-[#2672df] selection:text-white antialiased">
      {/* CỘT TRÁI: SHOWCASE HỆ SINH THÁI LOGISTICS & THƯƠNG HIỆU THILOGI (DEEP NAVY THEME CHUẨN SALESFLOW) */}
      <div className="hidden lg:flex lg:w-7/12 xl:w-2/3 flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-[#102f63] via-[#143775] to-[#0d244d] text-white shadow-2xl">
        {/* Hiệu ứng ánh sáng xanh dương & họa tiết lưới tinh tế */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#2672df]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#49a1ff] to-[#2367d9] flex items-center justify-center shadow-lg shadow-[#071c3d]/60 border border-white/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-wider text-white">THILOGI</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white border border-white/30">
                THACO GROUP
              </span>
            </div>
            <p className="text-xs text-[#d8e6fc] font-medium tracking-wide">
              Tập đoàn Logistics Chu Lai • Chu Lai International Logistics Hub
            </p>
          </div>
        </div>

        {/* Hero Pitch */}
        <div className="relative z-10 my-auto py-8 max-w-2xl space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#173b74] border border-[#2a65bc]/60 text-white text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#52da9a] animate-pulse" />
              Nền tảng Quản trị Vận hành Logistics Tích hợp • Release 1
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Số hóa toàn diện chuỗi cung ứng liên vận & Quản trị Báo giá P&L
            </h1>
            <p className="text-[#c7d8f2] text-sm xl:text-base leading-relaxed">
              Mô hình khép kín kết nối Cảng Quốc tế Chu Lai, đội xe đầu kéo đường bộ xuyên biên giới 
              <strong className="text-white font-bold"> Việt Nam – Nam Lào – Bắc Campuchia</strong>, hệ thống bãi Depot 
              và động cơ định giá tối ưu lợi nhuận thời gian thực.
            </p>
          </div>

          {/* 4 Trụ cột Vận hành (Thẻ kính sáng nổi bật) */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-[#2a65bc]/60 border border-white/25 flex items-center justify-center text-white mb-2.5 shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Vận tải Đường bộ Liên vận</h3>
              <p className="text-xs text-[#c7d8f2] leading-normal">
                Đội xe cont bạt, cont lạnh kết nối các cửa khẩu Bờ Y, Nam Giang, Lao Bảo.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-[#2a65bc]/60 border border-white/25 flex items-center justify-center text-white mb-2.5 shadow-xs">
                <Anchor className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Cảng Biển & Kho Bãi</h3>
              <p className="text-xs text-[#c7d8f2] leading-normal">
                Nâng hạ LOLO, bãi lưu cont, kho nông sản xuất nhập khẩu Cảng Chu Lai.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-[#2a65bc]/60 border border-white/25 flex items-center justify-center text-white mb-2.5 shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Động cơ Báo giá P&L</h3>
              <p className="text-xs text-[#c7d8f2] leading-normal">
                So sánh giá mua NCC, tính toán chi phí worst-case và duyệt báo giá đa cấp.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-[#2a65bc]/60 border border-white/25 flex items-center justify-center text-white mb-2.5 shadow-xs">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Khóa Bất biến Kế toán</h3>
              <p className="text-xs text-[#c7d8f2] leading-normal">
                Bảo vệ toàn vẹn dữ liệu hợp đồng thương mại, ngăn ngừa trôi lệch tỷ giá.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#83a4d6] pt-5 border-t border-white/15">
          <p>© 2026 THILOGI Logistics. Bản quyền thuộc Tập đoàn THACO.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#52da9a]" />
            <span>Hệ thống bảo mật nội bộ</span>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: KHU VỰC ĐĂNG NHẬP (CANVAS BĂNG XANH NHẠT #f5f8fc VỚI CARD TRẮNG SANG TRỌNG) */}
      <div className="w-full lg:w-5/12 xl:w-1/3 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-[#f5f8fc] border-l border-[#e2eaf4]">
        <div className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-2xl border border-[#e2eaf4] shadow-[0_4px_24px_rgba(22,59,116,0.06)] space-y-6" suppressHydrationWarning>
          {/* Header trên Mobile */}
          <div className="lg:hidden flex items-center gap-3 pb-3 border-b border-[#e2eaf4]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#49a1ff] to-[#2367d9] flex items-center justify-center text-white font-bold shadow-md shadow-[#2367d9]/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#16254a]">THILOGI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e8f2ff] text-[#2575df] font-bold">
                  THACO
                </span>
              </div>
              <p className="text-xs text-[#647895]">Hệ thống Quản trị Báo giá Logistics</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5 text-left">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#e8f2ff] border border-[#cbe1fc] text-[#2575df] text-[11px] font-bold uppercase tracking-wider mb-1">
              Cổng Đăng Nhập Nội Bộ
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#16254a] tracking-tight">Đăng nhập</h2>
            <p className="text-xs sm:text-sm text-[#647895]">
              Vui lòng nhập tài khoản nhân sự được cấp để tiếp tục.
            </p>
          </div>

          {/* Login Form */}
          <form action={action} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#33476b]">
                Tên đăng nhập / Mã nhân sự
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8fa0b9]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  maxLength={100}
                  placeholder="Nhập mã nhân sự (VD: 1412113, NV0001...)"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#e2eaf4] hover:border-[#cbd9ea] focus:border-[#2672df] rounded-lg text-[#16254a] placeholder:text-[#9aabc5] focus:outline-none focus:ring-4 focus:ring-[#2672df]/12 transition-all font-mono shadow-xs"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#33476b]">Mật khẩu</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8fa0b9]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={72}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#e2eaf4] hover:border-[#cbd9ea] focus:border-[#2672df] rounded-lg text-[#16254a] placeholder:text-[#9aabc5] focus:outline-none focus:ring-4 focus:ring-[#2672df]/12 transition-all font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8fa0b9] hover:text-[#16254a] transition-colors"
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
                className="p-3.5 rounded-lg bg-[#fff0f1] border border-[#fbd3d6] text-[#e45a63] text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#e45a63]" />
                <span className="font-medium leading-relaxed">{state.error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 px-4 rounded-lg bg-[#2672df] hover:bg-[#1d66c5] active:bg-[#1859ae] text-white font-bold text-sm shadow-[0_5px_14px_rgba(38,114,223,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
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

          {/* Security & Audit Notice */}
          <div className="pt-3 border-t border-[#e2eaf4] space-y-2">
            <div className="p-2.5 rounded-lg bg-[#f0f6ff] border border-[#d6e5fb] flex items-center gap-2.5 text-[#16254a] text-xs">
              <ShieldCheck className="w-4 h-4 text-[#14a773] shrink-0" />
              <span className="font-medium text-[11px]">Mã hóa SSL 256-bit • Kết nối CSDL THILOGI Production</span>
            </div>
            <p className="text-[10.5px] text-[#8fa0b9] leading-relaxed text-center">
              Hệ thống bảo mật nội bộ THILOGI • THACO GROUP.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
