"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, MapPin, Package, Truck, Layers, Receipt, Anchor, ShieldCheck, Ship, FileCheck, Warehouse, FileText, Plus, PanelLeftClose, PanelLeftOpen, Users } from "lucide-react";
export const navigation = [
  {
    label: "Danh mục", items: [
      { label: "Đối tác", href: "/master/customers", icon: Building2 },
      { label: "Địa điểm", href: "/master/locations", icon: MapPin },
      { label: "Hàng hóa", href: "/master/commodities", icon: Package },
      { label: "Đội xe", href: "/master/fleet", icon: Truck },
      { label: "Dịch vụ", href: "/master/services", icon: Layers },
    ]
  },
  {
    label: "Giá mua", items: [
      { label: "Giá mua đường bộ", href: "/rates", icon: Receipt },
      { label: "Biểu phí Cảng & Depot", href: "/rates/port", icon: Anchor },
      { label: "Biểu phí Cửa khẩu", href: "/rates/border", icon: ShieldCheck },
      { label: "Biểu cước Vận tải biển", href: "/rates/ocean", icon: Ship },
      { label: "Biểu phí Hải quan", href: "/rates/customs", icon: FileCheck },
      { label: "Biểu phí Kho bãi", href: "/rates/warehousing", icon: Warehouse },
    ]
  },
  {
    label: "Báo giá", items: [
      { label: "Danh sách báo giá", href: "/quotations", icon: FileText },
      { label: "Lập báo giá", href: "/quotations/new", icon: Plus },
    ]
  },
  {
    label: "Hệ thống", items: [
      { label: "Người dùng", href: "/master/users", icon: Users },
    ]
  },
];
export function ErpSidebar({ isCollapsed, onToggleCollapse, onNavigate, mobile = false }: { isCollapsed: boolean; onToggleCollapse: () => void; onNavigate?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  return <aside className={`${mobile ? "relative h-full w-full" : `fixed inset-y-0 left-0 z-40 ${isCollapsed ? "w-16" : "w-64"}`} flex flex-col border-r border-[#1f4178] bg-[#102f63] text-[#d8e6fc] transition-all`}>
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1f4178] px-4">
      {!isCollapsed && (
        <Link href="/quotations" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#49a1ff] to-[#2367d9] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-[#071c3d]/50">
            T
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wider text-white">THILOGI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-white font-bold border border-white/25">THACO</span>
            </div>
            <p className="text-[10px] text-[#83a4d6] font-medium leading-none mt-0.5">Logistics & Báo giá P&L</p>
          </div>
        </Link>
      )}
      {!mobile && <button type="button" onClick={onToggleCollapse} aria-label={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"} className="rounded p-1.5 text-[#83a4d6] hover:bg-[#1c437f] hover:text-white transition-colors">{isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>}
    </div>
    <nav aria-label="Điều hướng chính" className="flex-1 space-y-6 overflow-y-auto px-2.5 py-5">
      {navigation.map(group => <div key={group.label}>
        <p className={isCollapsed ? "sr-only" : "mb-2 px-3 text-[10px] font-bold text-[#83a4d6] uppercase tracking-wider"}>{group.label}</p>
        <div className="space-y-1">{group.items.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} onClick={onNavigate} title={isCollapsed ? item.label : undefined} aria-label={isCollapsed ? item.label : undefined} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all ${active ? "bg-[#2672df] text-white font-semibold shadow-[0_6px_18px_rgba(11,33,73,0.45)]" : "text-[#c7d8f2] hover:bg-[#1c437f] hover:text-white"}`}>
            <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[#83a4d6]"}`} />{!isCollapsed && item.label}
          </Link>;
        })}</div>
      </div>)}
    </nav>
    {!isCollapsed && (
      <div className="p-3 border-t border-[#1f4178]">
        <div className="rounded-lg p-2.5 bg-[#173b74] text-[#c7d8f2] text-xs flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#2a65bc] text-white flex items-center justify-center font-bold text-xs shrink-0">
            ✓
          </div>
          <div className="truncate">
            <strong className="block text-white text-[11px] font-bold">Hệ thống nội bộ</strong>
            <span className="text-[10px] text-[#9cb8df]">Vận hành Chu Lai Hub</span>
          </div>
        </div>
      </div>
    )}
  </aside>;
}
