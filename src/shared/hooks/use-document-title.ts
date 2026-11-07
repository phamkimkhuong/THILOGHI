"use client";

import { useEffect } from "react";

/**
 * Hook cập nhật tiêu đề tab trình duyệt động (Dynamic Document Title)
 * Tự động gắn hậu tố "| THILOGI" và khôi phục tiêu đề gốc khi unmount.
 *
 * @param title Tiêu đề của trang hiện tại (ví dụ: "Báo giá #BG-2026-001")
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title && title.trim()) {
      document.title = `${title.trim()} | THILOGI`;
    } else {
      document.title = "THILOGI - Chu Lai International Logistics Hub";
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

