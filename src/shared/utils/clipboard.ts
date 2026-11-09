/**
 * Sao chép văn bản vào clipboard an toàn trên cả HTTPS và HTTP không có SSL:
 * - HTTPS / Localhost (Secure Context): sử dụng navigator.clipboard.writeText
 * - HTTP Remote IP (Non-Secure Context): fallback document.execCommand('copy')
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. Thử dùng Clipboard API chuẩn nếu đang ở Secure Context
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Tiếp tục xuống fallback
    }
  }

  // 2. Fallback cho Non-Secure Context (truy cập qua HTTP IP trực tiếp)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return Boolean(success);
  } catch {
    return false;
  }
}
