"use client";

import { useEffect, useState, useTransition } from "react";
import { Globe } from "lucide-react";
import { getCurrentUserAction, switchUserAction, getAvailableUsersAction } from "@/features/quotation/actions";
import { CurrentActor } from "@/server/auth/types";

export function UserProfileBar() {
  const [currentUser, setCurrentUser] = useState<CurrentActor | null>(null);
  const [availableUsers, setAvailableUsers] = useState<CurrentActor[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const [user, allUsers] = await Promise.all([
        getCurrentUserAction(),
        getAvailableUsersAction(),
      ]);
      setCurrentUser(user);
      setAvailableUsers(allUsers);
    });
  }, []);

  const handleSwitchUser = (userId: string) => {
    startTransition(async () => {
      const res = await switchUserAction(userId);
      if (res.success) {
        setCurrentUser(res.actor);
        // Refresh trang để cập nhật quyền truy cập mới
        window.location.reload();
      }
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        Đang tải hồ sơ...
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    PRICING_MANAGER: "Trưởng phòng Định giá & Thương mại",
    PRICING_SPECIALIST: "Chuyên viên Định giá",
    SALES: "Chuyên viên Kinh doanh (Sales)",
    DIRECTOR: "Phó Giám Đốc Thương Mại (BOD)",
    OPERATIONS: "Điều hành Vận tải",
    ACCOUNTANT: "Kế toán Quản trị",
  };

  const regionNames: Record<string, string> = {
    REG_QNG_QNM: "Chu Lai - Quảng Nam",
    REG_SOUTH_LAOS: "Nam Lào (Sekong/Attapeu)",
    REG_NORTH_CAM: "Bắc Cam (Kratie/Stung Treng)",
    "*": "Toàn Quyền Hệ Thống (*)",
  };

  return (
    <div className="flex items-center gap-3">
      {/* Thông tin người dùng đang đăng nhập */}
      <div className="hidden lg:flex flex-col text-right">
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-xs font-bold text-slate-200">
            {currentUser.fullName}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 font-mono font-semibold border border-blue-500/25">
            {currentUser.role}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[220px]">
          {roleLabels[currentUser.role] || currentUser.role}
        </span>
      </div>

      {/* Region Scope Badge */}
      <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate max-w-[160px]">
          {currentUser.regionScopes.map((r) => regionNames[r] || r).join(", ")}
        </span>
      </div>

      {/* Dropdown chuyển đổi tài khoản mô phỏng phân quyền */}
      <div className="relative">
        <select
          value={currentUser.userId}
          onChange={(e) => handleSwitchUser(e.target.value)}
          disabled={isPending}
          className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          title="Chuyển đổi tài khoản để kiểm thử phân quyền Region Scope"
        >
          {availableUsers.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.fullName} ({u.role} - {u.regionScopes.join("/")})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
