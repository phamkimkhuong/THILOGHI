"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, MapPin, Package, Truck, Receipt, FileText, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
export const navigation = [
  { label: "Danh mục", items: [
    { label: "Đối tác", href: "/master/customers", icon: Building2 },
    { label: "Địa điểm", href: "/master/locations", icon: MapPin },
    { label: "Hàng hóa", href: "/master/commodities", icon: Package },
    { label: "Đội xe", href: "/master/fleet", icon: Truck },
  ] },
  { label: "Giá mua", items: [{ label: "Giá mua đường bộ", href: "/rates", icon: Receipt }] },
  { label: "Báo giá", items: [
    { label: "Danh sách báo giá", href: "/quotations", icon: FileText },
    { label: "Lập báo giá", href: "/quotations/new", icon: Plus },
  ] },
];
export function ErpSidebar({ isCollapsed, onToggleCollapse, onNavigate, mobile = false }: { isCollapsed: boolean; onToggleCollapse: () => void; onNavigate?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  return <aside className={`${mobile ? "relative h-full w-full" : `fixed inset-y-0 left-0 z-40 ${isCollapsed ? "w-16" : "w-64"}`} flex flex-col border-r border-slate-800 bg-slate-900`}>
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
      {!isCollapsed && <Link href="/quotations" onClick={onNavigate} className="font-semibold tracking-wide text-white">THILOGI</Link>}
      {!mobile && <button type="button" onClick={onToggleCollapse} aria-label={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">{isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>}
    </div>
    <nav aria-label="Điều hướng chính" className="flex-1 space-y-6 overflow-y-auto px-2 py-5">
      {navigation.map(group => <div key={group.label}>
        <p className={isCollapsed ? "sr-only" : "mb-2 px-3 text-xs font-semibold text-slate-500"}>{group.label}</p>
        <div className="space-y-1">{group.items.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} onClick={onNavigate} title={isCollapsed ? item.label : undefined} aria-label={isCollapsed ? item.label : undefined} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${active ? "bg-blue-600/15 text-blue-300" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{!isCollapsed && item.label}
          </Link>;
        })}</div>
      </div>)}
    </nav>
    {!isCollapsed && <p className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">Quản lý danh mục và báo giá</p>}
  </aside>;
}
