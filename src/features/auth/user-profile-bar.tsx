"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";
import { Globe } from "lucide-react";
import { getCurrentUserAction, switchUserAction, getAvailableUsersAction } from "@/features/quotation/actions";
import { CurrentActor } from "@/server/auth/types";

export function UserProfileBar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentActor | null>(null);
  const [availableUsers, setAvailableUsers] = useState<CurrentActor[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const [user, allUsers] = await Promise.all([
          getCurrentUserAction(),
          getAvailableUsersAction(),
        ]);
        setCurrentUser(user);
        setAvailableUsers(allUsers);
      } catch {
        setError("Không thể tải phiên đăng nhập.");
      } finally {
        setIsLoaded(true);
      }
    });
  }, []);

  const handleSwitchUser = (userId: string) => {
    startTransition(async () => {
      try {
        const res = await switchUserAction(userId);
        if (res.success) {
          if (window.location.pathname === "/login") router.replace("/quotations");
          else window.location.reload(); // Discard all data cached in client state when switching identity.
        }
      } catch {
        setError("Không thể chuyển tài khoản. Vui lòng kiểm tra cấu hình chế độ thử và JWT_SECRET.");
      }

    });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        Đang tải hồ sơ...
      </div>
    );
  }

  if (!currentUser) {
    return <div className="space-y-2 text-xs text-slate-400">
      {availableUsers.length > 0 ? <label>Chọn tài khoản thử nghiệm
        <select value="" onChange={(event) => handleSwitchUser(event.target.value)} disabled={isPending}
          className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2">
          <option value="" disabled>Chọn tài khoản</option>
          {availableUsers.map((user) => <option key={user.userId} value={user.userId}>{user.fullName} ({user.role})</option>)}
        </select>
      </label> : <Link href="/login">Chưa đăng nhập</Link>}
      {error && <p role="alert" className="text-rose-300">{error}</p>}
    </div>;
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
    <div className="flex items-center gap-3">
      {error && <span role="alert" className="text-xs text-rose-300">{error}</span>}
      <form action={logoutAction}><button className="text-xs text-slate-300">Đăng xuất</button></form>
      {/* Thông tin người dùng đang đăng nhập */}
      <div className="hidden sm:flex flex-col text-right">
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-xs font-bold text-slate-200">
            {currentUser.fullName}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[220px]">
          {roleLabels[currentUser.role] || currentUser.role}
        </span>
      </div>

      {/* Region Scope Badge */}
      <div className="hidden xl:inline-flex items-center gap-1.5 text-slate-400 text-xs">
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <span title={formattedScopes} className="truncate max-w-[160px]">
          {formattedScopes}
        </span>
      </div>

      {/* Dropdown chuyển đổi tài khoản (Chỉ hiển thị trong môi trường Dev/UAT để test phân quyền) */}
      {availableUsers.length > 0 && (
          <div className="relative">
            <select
              value={currentUser.userId}
              onChange={(e) => handleSwitchUser(e.target.value)}
              disabled={isPending}
              className="max-w-[160px] bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              aria-label="Tài khoản thử nghiệm" title="Chuyển tài khoản thử nghiệm"
            >
            {availableUsers.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.fullName} ({u.role} - {u.regionScopes.join("/")})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
