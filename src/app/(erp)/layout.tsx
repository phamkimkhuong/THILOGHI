import { ErpShell } from "@/components/layout/erp-shell";
import { redirect } from "next/navigation";
import { getSessionActor } from "@/server/auth/session";
import { findUserById } from "@/server/auth/users";
import { Suspense } from "react";

async function AuthenticatedErp({ children }: { children: React.ReactNode }) {
  const session = await getSessionActor();
  if (!session || !await findUserById(session.userId)) redirect("/login");
  return <ErpShell>{children}</ErpShell>;
}

export default function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-400">Đang tải phiên làm việc…</p>}>
      <AuthenticatedErp>{children}</AuthenticatedErp>
    </Suspense>
  );
}

