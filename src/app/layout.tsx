import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "THILOGI - Chu Lai International Logistics Hub",
    template: "%s | THILOGI",
  },
  description:
    "Hệ thống quản lý định giá, cước vận tải đường bộ và báo giá khách hàng - Tập đoàn THILOGI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-blue-600 selection:text-white" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
