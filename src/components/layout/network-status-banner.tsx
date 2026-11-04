"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Đã khôi phục kết nối mạng Internet thành công.", {
        description: "Hệ thống đã sẵn sàng đồng bộ dữ liệu.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Mất kết nối Internet!", {
        description: "Vui lòng kiểm tra lại đường truyền mạng để tránh gián đoạn.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top duration-200 z-50 sticky top-0"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-bounce" />
      <span>
        Cảnh báo: Đang mất kết nối mạng Internet. Các thao tác lưu dữ liệu mới có thể bị gián đoạn.
      </span>
    </div>
  );
}
