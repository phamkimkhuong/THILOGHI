import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THILOGI | Quản lý báo giá",
  description:
    "Quản lý danh mục logistics, giá mua đường bộ và báo giá khách hàng.",
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
      </body>
    </html>
  );
}
