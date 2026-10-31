"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ErpSidebar } from "./erp-sidebar";
import { ErpHeader } from "./erp-header";
export function ErpShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return <div className="erp-shell flex min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
    <a href="#main-content" className="sr-only z-[100] rounded bg-blue-600 p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Đến nội dung chính</a>
    <div className="hidden md:block"><ErpSidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} /></div>
    <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <div className={`flex min-w-0 flex-1 flex-col ${isCollapsed ? "md:ml-16" : "md:ml-64"}`}>
        <ErpHeader onToggleMobileMenu={() => setMobileMenuOpen(true)} mobileMenuOpen={mobileMenuOpen} />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1700px] flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 md:hidden" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:hidden">
          <Dialog.Title className="sr-only">Menu THILOGI</Dialog.Title>
          <ErpSidebar mobile isCollapsed={false} onToggleCollapse={() => setMobileMenuOpen(false)} onNavigate={() => setMobileMenuOpen(false)} />
          <Dialog.Close aria-label="Đóng menu" className="absolute right-4 top-5 rounded p-1 text-slate-300 hover:bg-slate-800"><X className="h-5 w-5" /></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}
