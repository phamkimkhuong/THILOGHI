import Link from "next/link";
import {
  FileText,
  Truck,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { UserProfileBar } from "@/features/auth/user-profile-bar";

export default function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Enterprise Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Module */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                TLG
              </div>
              <div>
                <span className="font-extrabold text-base tracking-wide text-white block">
                  THILOGI LOGISTICS
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                  ENTERPRISE OPERATIONS
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-slate-800 hidden md:block" />

            {/* Main Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Tổng Quan
              </Link>
              <Link
                href="/quotations/new"
                className="px-3 py-1.5 rounded-md bg-blue-600/15 text-blue-400 font-medium border border-blue-500/30 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Báo Giá & Pricing
              </Link>
              <div className="px-3 py-1.5 rounded-md text-slate-500 cursor-not-allowed flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Đơn Hàng (Order)
              </div>
              <div className="px-3 py-1.5 rounded-md text-slate-500 cursor-not-allowed flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Đối Soát AR/AP
              </div>
            </nav>
          </div>

          {/* User & Region Scope Badge */}
          <UserProfileBar />
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        THILOGI Logistics Platform &copy; 2026 THACO Chu Lai. Hệ thống điều hành & hạch toán P&L chuẩn VND.
      </footer>
    </div>
  );
}
