"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  PlusCircle,
  Search,
  Building2,
  MapPin,
  Package,
  Truck,
  Layers,
  Navigation,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
} from "lucide-react";

interface ErpSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof FileText;
  badge?: string;
  highlight?: boolean;
  disabled?: boolean;
  phase?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function ErpSidebar({ isCollapsed, onToggleCollapse }: ErpSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/quotations") {
      return pathname === "/quotations";
    }
    return pathname.startsWith(href);
  };

  const navGroups: NavGroup[] = [
    {
      title: "BÁO GIÁ THƯƠNG MẠI",
      items: [
        {
          label: "Danh Sách Báo Giá",
          href: "/quotations",
          icon: FileText,
          badge: "164",
        },
        {
          label: "Lập Báo Giá Mới",
          href: "/quotations/new",
          icon: PlusCircle,
          highlight: true,
        },
        {
          label: "Bảng Giá Cước Mua",
          href: "/rates",
          icon: Search,
          badge: "130",
        },
      ],
    },
    {
      title: "DANH MỤC GỐC (MASTER DATA)",
      items: [
        {
          label: "Khách Hàng & NCC",
          href: "/master/customers",
          icon: Building2,
          badge: "272",
        },
        {
          label: "Địa Điểm & Cảng Biển",
          href: "/master/locations",
          icon: MapPin,
          badge: "160",
        },
        {
          label: "Mặt Hàng Nông Sản / CN",
          href: "/master/commodities",
          icon: Package,
          badge: "38",
        },
        {
          label: "Đội Xe & Rơ-moóc",
          href: "/master/fleet",
          icon: Truck,
          badge: "1.6k",
        },
      ],
    },
    {
      title: "LỘ TRÌNH TIẾP THEO",
      items: [
        {
          label: "Đơn Hàng & P&L",
          href: "#",
          icon: Layers,
          disabled: true,
          phase: "Giai đoạn 2",
        },
        {
          label: "Điều Phối Đội Xe",
          href: "#",
          icon: Navigation,
          disabled: true,
          phase: "Giai đoạn 2",
        },
        {
          label: "Đối Soát AR / AP",
          href: "#",
          icon: Receipt,
          disabled: true,
          phase: "Giai đoạn 3",
        },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-all duration-200 select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-slate-800/80 px-3.5 flex items-center justify-between shrink-0">
        <Link href="/quotations" className="flex items-center gap-2.5 overflow-hidden group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition-colors shrink-0">
            TLG
          </div>
          {!isCollapsed && (
            <div className="leading-tight truncate">
              <span className="font-extrabold text-xs tracking-wider text-white block">
                THILOGI LOGISTICS
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                THACO Chu Lai Hub
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors hidden md:block"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const active = !item.disabled && isActive(item.href);

                if (item.disabled) {
                  return (
                    <div
                      key={iIdx}
                      title={isCollapsed ? `${item.label} (${item.phase})` : undefined}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-600 cursor-not-allowed text-xs"
                    >
                      <Icon className="w-4 h-4 shrink-0 text-slate-600" />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                          <span className="truncate">{item.label}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono">
                            {item.phase}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? "bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30"
                        : item.highlight
                        ? "text-slate-200 hover:text-white hover:bg-blue-600/10"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active
                          ? "text-blue-400"
                          : item.highlight
                          ? "text-blue-400"
                          : "text-slate-400"
                      }`}
                    />
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              active
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950 shrink-0 text-xs">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL 16
              </span>
              <span className="font-mono text-[10px] text-emerald-400">3,648 rows</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>v1.2-R1 ERP</span>
              <Link href="/" className="hover:text-slate-300 flex items-center gap-0.5">
                Portal <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="PostgreSQL 16: Connected (3,648 rows)">
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
}
