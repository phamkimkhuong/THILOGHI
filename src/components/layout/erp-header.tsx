"use client";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import { UserProfileBar } from "@/features/auth/user-profile-bar";
import { navigation } from "./erp-sidebar";
import * as Dialog from "@radix-ui/react-dialog";
export function ErpHeader({ onToggleMobileMenu, mobileMenuOpen }: { onToggleMobileMenu: () => void; mobileMenuOpen: boolean }) {
  const pathname = usePathname();
  const group = navigation.find(group => group.items.some(item => item.href === pathname));
  const item = group?.items.find(item => item.href === pathname);
  return <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-white/95 backdrop-blur-xs px-4 md:px-6 shadow-[0_1px_3px_rgba(22,59,116,0.04)]">
    <div className="flex min-w-0 items-center gap-3">
      <Dialog.Trigger asChild><button type="button" onClick={onToggleMobileMenu} aria-label="Mở menu" aria-expanded={mobileMenuOpen} className="erp-button text-muted-foreground hover:text-foreground md:hidden"><Menu className="h-5 w-5" /></button></Dialog.Trigger>
      <nav aria-label="Đường dẫn" className="hidden items-center gap-2 text-xs sm:flex">
        <span className="text-muted-foreground font-medium">{group?.label || "THILOGI"}</span><ChevronRight aria-hidden="true" className="h-3 w-3 text-muted-foreground opacity-60" />
        <span aria-current="page" className="text-foreground font-bold">{pathname === "/quotations/new" ? "Soạn báo giá" : item?.label}</span>
      </nav>
    </div>
    <UserProfileBar />
  </header>;
}
