"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { Globe } from "lucide-react";
import { getCurrentUserAction } from "@/features/quotation/actions";
import { CurrentActor } from "@/server/auth/types";

export function UserProfileBar() {
  const [currentUser, setCurrentUser] = useState<CurrentActor | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const user = await getCurrentUserAction();
        setCurrentUser(user);
      } catch {
        setError("Không thể tải phiên đăng nhập.");
      } finally {
        setIsLoaded(true);
      }
    });
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground" suppressHydrationWarning>
        <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
        Đang tải hồ sơ...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-1 text-xs text-muted-foreground" suppressHydrationWarning>
        <Link href="/login" className="hover:text-primary transition-colors font-medium">Chưa đăng nhập</Link>
        {error && <p role="alert" className="text-rose-500">{error}</p>}
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    PRICING_MANAGER: "Trưởng phòng định giá",
    PRICING_SPECIALIST: "Chuyên viên Định giá",
    SALES: "Kinh doanh",
    DIRECTOR: "Giám đốc thương mại",
    OPERATIONS: "Điều hành Vận tải",
    ACCOUNTANT: "Kế toán Quản trị",
  };

  const formattedScopes = currentUser.regionScopes && currentUser.regionScopes.length > 0
    ? currentUser.regionScopes.map((r) => (r === "*" ? "Tất cả phân vùng" : r)).join(", ")
    : "Chưa gán phân vùng";

  return (
    <div className="flex items-center gap-3" suppressHydrationWarning>
      {error && <span role="alert" className="text-xs text-rose-500 font-medium">{error}</span>}
      <form action={logoutAction}><button className="text-xs text-muted-foreground hover:text-rose-600 font-medium transition-colors cursor-pointer">Đăng xuất</button></form>
      {/* Thông tin người dùng đang đăng nhập */}
      <div className="hidden sm:flex flex-col text-right">
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-xs font-bold text-foreground">
            {currentUser.fullName}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[220px]">
          {roleLabels[currentUser.role] || currentUser.role}
        </span>
      </div>

      {/* Avatar tròn chuẩn SalesFlow */}
      <div className="w-8 h-8 rounded-full bg-[#dceafa] text-[#1763c7] font-bold text-xs flex items-center justify-center shrink-0 border border-[#c2dafc]" aria-hidden="true">
        {currentUser.fullName ? currentUser.fullName.trim().split(" ").slice(-1)[0][0] : "U"}
      </div>

      {/* Region Scope Badge */}
      <div className="hidden xl:inline-flex items-center gap-1.5 text-muted-foreground text-xs">
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <span title={formattedScopes} className="truncate max-w-[160px]">
          {formattedScopes}
        </span>
      </div>
    </div>
  );
}
