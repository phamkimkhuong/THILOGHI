import type { UserItem, SaveUserInput } from "@/features/master-data/user-actions";
import type { UserRole } from "@/server/auth/types";

export type { UserItem, SaveUserInput, UserRole };

export type UserRoleFilter = "ALL" | UserRole;
export type UserStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export interface RoleConfig {
  id: UserRole;
  label: string;
  department: string;
  description: string;
  badgeClass: string;
}

export const ROLES_LIST: RoleConfig[] = [
  {
    id: "ADMIN",
    label: "Quản trị hệ thống",
    department: "Ban CNTT / Quản trị",
    description: "Toàn quyền quản lý hệ thống, cấu hình dữ liệu, phân quyền tài khoản người dùng",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  {
    id: "DIRECTOR",
    label: "Ban Giám đốc",
    department: "Ban Lãnh đạo THILOGI",
    description: "Phê duyệt báo giá vượt thẩm quyền, xem báo cáo tổng thể, kiểm soát P&L tập đoàn",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  {
    id: "PRICING_MANAGER",
    label: "Trưởng phòng Định giá",
    department: "Phòng Định giá & Mua cước",
    description: "Phê duyệt biên lợi nhuận báo giá, quản lý bảng giá mua đường bộ và cước cảng",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  {
    id: "PRICING_SPECIALIST",
    label: "Chuyên viên Định giá",
    department: "Phòng Định giá & Mua cước",
    description: "Nhập liệu và cập nhật biểu cước nhà cung cấp, đối soát giá vốn và định mức",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  },
  {
    id: "SALES",
    label: "Chuyên viên Kinh doanh",
    department: "Phòng Kinh doanh & Dịch vụ Khách hàng",
    description: "Soạn thảo báo giá khách hàng, theo dõi hợp đồng và chăm sóc đối tác vận chuyển",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    id: "OPERATIONS",
    label: "Điều vận & Khai thác",
    department: "Trung tâm Điều vận & Đội xe",
    description: "Quản lý đội xe, tài xế, điều phối phương tiện và giám sát tiến độ giao nhận",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  {
    id: "ACCOUNTANT",
    label: "Kế toán & Tài chính",
    department: "Phòng Kế toán - Tài chính",
    description: "Đối soát công nợ, hạn mức tín dụng khách hàng, hạch toán doanh thu và chi phí",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  },
];

export interface RegionScopeConfig {
  id: string;
  code: string;
  label: string;
  badgeClass: string;
}

export const REGION_SCOPES_LIST: RegionScopeConfig[] = [
  {
    id: "*",
    code: "*",
    label: "Toàn quyền (Tất cả vùng)",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
  },
  {
    id: "QUANG_NAM_NEIGHBORS",
    code: "REG_QNM",
    label: "Quảng Nam & Lân cận (Chu Lai)",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
  },
  {
    id: "SOUTH_LAOS",
    code: "REG_LAO",
    label: "Nam Lào (Attapeu, Sekong)",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  },
  {
    id: "NORTH_CAMBODIA_CENTRAL_HIGHLANDS",
    code: "REG_CAM",
    label: "Bắc Campuchia & Tây Nguyên",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  {
    id: "NORTHERN_REGION",
    code: "REG_MB",
    label: "Miền Bắc (Hà Nội, Hải Phòng)",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  },
  {
    id: "SOUTHERN_REGION_SNUOL",
    code: "REG_MN",
    label: "Miền Nam & Snuol",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300",
  },
];

export const STATUS_LIST: { id: UserStatusFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả trạng thái" },
  { id: "ACTIVE", label: "Đang hoạt động" },
  { id: "INACTIVE", label: "Tạm khóa" },
];

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function getRoleBadge(role: string): { label: string; className: string } {
  const found = ROLES_LIST.find((r) => r.id === role);
  if (found) {
    return {
      label: found.label,
      className: found.badgeClass,
    };
  }
  return {
    label: role,
    className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300",
  };
}

export function getRegionScopeBadge(scope: string): { label: string; className: string } {
  const found = REGION_SCOPES_LIST.find((r) => r.id === scope || r.code === scope);
  if (found) {
    return {
      label: found.label,
      className: found.badgeClass,
    };
  }
  return {
    label: scope,
    className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300",
  };
}
