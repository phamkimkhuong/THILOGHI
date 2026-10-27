"use client";

import { useActionState } from "react";
import { loginAction } from "@/features/auth/actions";
import { UserProfileBar } from "@/features/auth/user-profile-bar";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-slate-700 bg-slate-900 p-6">
        <h1 className="text-xl font-semibold">Đăng nhập THILOGI</h1>
        <form action={action} className="space-y-4">
          <label className="block text-sm">Tên đăng nhập
            <input name="username" autoComplete="username" required maxLength={100} className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" />
          </label>
          <label className="block text-sm">Mật khẩu
            <input name="password" type="password" autoComplete="current-password" required maxLength={72} className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" />
          </label>
          {state.error && <p role="alert" className="text-sm text-rose-300">{state.error}</p>}
          <button disabled={pending} className="w-full rounded bg-blue-600 p-2 disabled:opacity-50">{pending ? "Đang đăng nhập…" : "Đăng nhập"}</button>
        </form>
        <UserProfileBar />
      </div>
    </main>
  );
}
