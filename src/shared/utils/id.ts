/**
 * Tạo định danh ngẫu nhiên (UUID v4) an toàn trên mọi môi trường:
 * - HTTPS / Localhost (Secure Context): sử dụng Web Crypto API crypto.randomUUID()
 * - HTTP Remote IP (Non-Secure Context): fallback thuật toán RFC 4122 v4
 * - Node.js SSR / Tests: an toàn không crash dù không có window.crypto
 */
export function generateSafeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
