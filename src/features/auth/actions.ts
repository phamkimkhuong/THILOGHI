"use server";

import { compare } from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { pool } from "@/server/db";
import { findUserById } from "@/server/auth/users";
import { clearSessionActor, setSessionActor } from "@/server/auth/session";

const credentials = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});

// Giới hạn thử mật khẩu trên từng tiến trình; không chứa mật khẩu hay token.
const attempts = new Map<string, { count: number; until: number }>();

export async function loginAction(_state: { error: string }, form: FormData) {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Nhập tên đăng nhập và mật khẩu hợp lệ." };
  const { username, password } = parsed.data;
  const key = username.toLowerCase();
  const now = Date.now();
  for (const [entry, value] of attempts) if (value.until <= now) attempts.delete(entry);
  const attempt = attempts.get(key) ?? { count: 0, until: now + 15 * 60_000 };
  if (attempt.count >= 5 || attempts.size >= 10_000) return { error: "Đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút." };
  attempts.set(key, { ...attempt, count: attempt.count + 1 });
  try {
    const { rows } = await pool.query(
      "SELECT user_id, password_hash FROM users WHERE username = $1 AND is_active = true", [username]
    );
    const user = rows[0];
    if (!user?.password_hash || !await compare(password, user.password_hash)) {
      return { error: "Tên đăng nhập hoặc mật khẩu không đúng." };
    }
    const actor = await findUserById(user.user_id);
    if (!actor) return { error: "Tài khoản không còn hoạt động." };
    await setSessionActor(actor);
    attempts.delete(key);
  } catch {
    return { error: "Không thể đăng nhập. Vui lòng kiểm tra cấu hình hệ thống." };
  }
  redirect("/quotations");
}

export async function logoutAction() {
  await clearSessionActor();
  redirect("/login");
}
