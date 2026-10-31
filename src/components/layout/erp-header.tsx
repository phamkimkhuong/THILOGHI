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
  return <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4">
    <div className="flex min-w-0 items-center gap-3">
      <Dialog.Trigger asChild><button type="button" onClick={onToggleMobileMenu} aria-label="Mở menu" aria-expanded={mobileMenuOpen} className="erp-button text-slate-300 md:hidden"><Menu className="h-5 w-5" /></button></Dialog.Trigger>
      <nav aria-label="Đường dẫn" className="hidden items-center gap-2 text-sm sm:flex">
        <span className="text-slate-400">{group?.label || "THILOGI"}</span><ChevronRight aria-hidden="true" className="h-3 w-3 text-slate-500" />
        <span aria-current="page" className="text-slate-200">{pathname === "/quotations/new" ? "Soạn báo giá" : item?.label}</span>
      </nav>
    </div>
    <UserProfileBar />
  </header>;
}
