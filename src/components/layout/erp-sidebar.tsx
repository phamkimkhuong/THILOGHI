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
  return <aside className={`${mobile ? "relative h-full w-full" : `fixed inset-y-0 left-0 z-40 ${isCollapsed ? "w-16" : "w-64"}`} flex flex-col border-r border-border bg-surface transition-all`}>
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
      {!isCollapsed && (
        <Link href="/quotations" onClick={onNavigate} className="flex items-center gap-2">
          <span className="font-black text-lg tracking-wider text-primary">THILOGI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold dark:bg-blue-900/30 dark:text-blue-300">THACO</span>
        </Link>
      )}
      {!mobile && <button type="button" onClick={onToggleCollapse} aria-label={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"} className="rounded p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors">{isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>}
    </div>
    <nav aria-label="Điều hướng chính" className="flex-1 space-y-6 overflow-y-auto px-2 py-5">
      {navigation.map(group => <div key={group.label}>
        <p className={isCollapsed ? "sr-only" : "mb-2 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider"}>{group.label}</p>
        <div className="space-y-1">{group.items.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} onClick={onNavigate} title={isCollapsed ? item.label : undefined} aria-label={isCollapsed ? item.label : undefined} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"}`}>
            <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />{!isCollapsed && item.label}
          </Link>;
        })}</div>
      </div>)}
    </nav>
    {!isCollapsed && <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">Quản lý danh mục và báo giá</p>}
  </aside>;
}
