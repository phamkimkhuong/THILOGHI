"use client";

import { useState } from "react";
import { ErpSidebar } from "./erp-sidebar";
import { ErpHeader } from "./erp-header";

interface ErpShellProps {
  children: React.ReactNode;
}

export function ErpShell({ children }: ErpShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Desktop Fixed Left Sidebar */}
      <div className="hidden md:block">
        <ErpSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">
            <ErpSidebar
              isCollapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Container Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        {/* Top Header Bar */}
        <ErpHeader onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Scrollable Data-dense Workspace */}
        <main className="flex-1 p-4 md:p-6 w-full max-w-[1700px] mx-auto overflow-x-hidden">
          {children}
        </main>

        {/* Concise Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-2.5 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>THILOGI Logistics Platform &copy; 2026 THACO Chu Lai</span>
          <span className="font-mono">P&L Currency: VND • PostgreSQL 16</span>
        </footer>
      </div>
    </div>
  );
}
