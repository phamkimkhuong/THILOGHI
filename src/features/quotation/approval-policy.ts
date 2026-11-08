export interface ApprovalAuthorityResult {
  allowed: boolean;
  requiredRole: "PRICING_MANAGER" | "DIRECTOR";
  isBodEscalation: boolean;
  reason?: string;
}

export function isQuotationAuthor(userId: string | undefined, displayName: string | undefined, actor: {userId: string; fullName: string}) {
  if (userId) return userId === actor.userId;
  // Older records contain either a user ID, a full name, or "Full name (ROLE)".
  const legacyName = displayName?.replace(/\s+\([^()]+\)$/, "");
  return displayName === actor.userId || legacyName === actor.fullName;
}

/**
 * Ma trận Phân quyền Duyệt Báo giá theo Biên lợi nhuận (PR-05 Approval Matrix)
 * - Margin >= 15%: Trưởng phòng Định giá & Thương mại (PRICING_MANAGER) hoặc cấp cao hơn
 * - Margin 5% - 14.9%: Phó Giám Đốc Thương Mại (DIRECTOR)
 * - Margin < 5%: Bắt buộc Ban Giám Đốc (DIRECTOR) với cờ ngoại lệ phê duyệt đặc biệt (BOD Exception)
 * - SALES: Không có quyền phê duyệt
 */
export function evaluateApprovalAuthority(
  marginPercent: number,
  actorRole: string
): ApprovalAuthorityResult {
  const isBodEscalation = marginPercent < 5;
  const requiredRole = marginPercent >= 15 ? "PRICING_MANAGER" : "DIRECTOR";

  if (actorRole === "SALES" || actorRole === "OPERATIONS" || actorRole === "ACCOUNTANT") {
    return {
      allowed: false,
      requiredRole,
      isBodEscalation,
      reason: "Chuyên viên Kinh doanh / Tác nghiệp không có thẩm quyền phê duyệt báo giá thương mại.",
    };
  }

  if (actorRole === "PRICING_MANAGER") {
    if (marginPercent < 15) {
      return {
        allowed: false,
        requiredRole: "DIRECTOR",
        isBodEscalation,
        reason: `Báo giá có biên lợi nhuận ${marginPercent}% (< 15%). Theo ma trận phân quyền THILOGI, chỉ cấp Phó Giám Đốc Thương Mại (DIRECTOR) mới có thẩm quyền duyệt.`,
      };
    }
    return {
      allowed: true,
      requiredRole: "PRICING_MANAGER",
      isBodEscalation: false,
    };
  }

  if (actorRole === "DIRECTOR" || actorRole === "ADMIN") {
    return {
      allowed: true,
      requiredRole: "DIRECTOR",
      isBodEscalation,
      reason: isBodEscalation
        ? "Phê duyệt ngoại lệ đặc biệt cấp Ban Giám Đốc (BOD Special Exception) cho biên lợi nhuận thấp < 5%."
        : undefined,
    };
  }

  return {
    allowed: false,
    requiredRole: "DIRECTOR",
    isBodEscalation: true,
    reason: "Tài khoản không có thẩm quyền phê duyệt báo giá.",
  };
}

