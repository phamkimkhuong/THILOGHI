"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { UserProfileBar } from "@/features/auth/user-profile-bar";

interface ErpHeaderProps {
  onToggleMobileMenu: () => void;
}

export function ErpHeader({ onToggleMobileMenu }: ErpHeaderProps) {
  const pathname = usePathname();

  // Dynamic Breadcrumb based on route
  const getBreadcrumbs = () => {
    const crumbs = [{ label: "THILOGI", href: "/quotations" }];

    if (pathname.startsWith("/quotations")) {
      crumbs.push({ label: "Báo Giá Thương Mại", href: "/quotations" });
      if (pathname === "/quotations/new") {
        crumbs.push({ label: "Lập Báo Giá", href: "/quotations/new" });
      }
    } else if (pathname.startsWith("/rates")) {
      crumbs.push({ label: "Thư Viện Giá Cước Mua", href: "/rates" });
    } else if (pathname.startsWith("/master/customers")) {
      crumbs.push({ label: "Danh Mục", href: "/master/customers" });
      crumbs.push({ label: "Khách Hàng & Nhà Cung Cấp", href: "/master/customers" });
    } else if (pathname.startsWith("/master/locations")) {
      crumbs.push({ label: "Danh Mục", href: "/master/locations" });
      crumbs.push({ label: "Mạng Lưới Địa Điểm & Cảng", href: "/master/locations" });
    } else if (pathname.startsWith("/master/commodities")) {
      crumbs.push({ label: "Danh Mục", href: "/master/commodities" });
      crumbs.push({ label: "Mặt Hàng Vận Chuyển", href: "/master/commodities" });
    } else if (pathname.startsWith("/master/fleet")) {
      crumbs.push({ label: "Danh Mục", href: "/master/fleet" });
      crumbs.push({ label: "Đội Xe & Rơ-moóc", href: "/master/fleet" });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav className="flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                {isLast ? (
                  <span className="font-semibold text-slate-100">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right: Region Scope Indicator & User Profile Bar */}
      <div className="flex items-center gap-4">
        {/* Hub indicator badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Vùng điều hành:</span>
          <span className="font-semibold text-white">Chu Lai (HQ) • Nam Lào • Campuchia</span>
        </div>

        {/* User Profile Bar (with live actor switcher) */}
        <UserProfileBar />
      </div>
    </header>
  );
}
