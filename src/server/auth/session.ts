import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { CurrentActor } from "./types";
import { findUserById, getActiveUsersList } from "./users";

const SESSION_COOKIE_NAME = "thilogi_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET
);

export async function createSessionToken(actor: CurrentActor): Promise<string> {
  return new SignJWT({
    userId: actor.userId,
    username: actor.username,
    fullName: actor.fullName,
    role: actor.role,
    regionScopes: actor.regionScopes,
    email: actor.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<CurrentActor | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      fullName: payload.fullName as string,
      role: payload.role as CurrentActor["role"],
      regionScopes: (payload.regionScopes as string[]) || [],
      email: payload.email as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function getSessionActor(): Promise<CurrentActor | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const verified = await verifySessionToken(token);
      if (verified) return verified;
    }
  } catch {
    // In edge or static build cases where cookies() may fail
  }

  // Tự động chọn tài khoản đầu tiên thực tế trong CSDL PostgreSQL
  const activeUsers = await getActiveUsersList();
  if (activeUsers.length > 0) {
    return activeUsers[0];
  }

  return null;
}

export async function setSessionActor(actor: CurrentActor): Promise<void> {
  const token = await createSessionToken(actor);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function switchSessionUser(userId: string): Promise<CurrentActor> {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && process.env.ENABLE_DEMO_AUTH !== "true") {
    throw new Error(
      "Từ chối quyền (403): Chức năng chuyển đổi tài khoản (impersonation) bị vô hiệu hóa trên môi trường Production."
    );
  }

  const dbUser = await findUserById(userId);
  if (!dbUser) {
    throw new Error(`Không tìm thấy người dùng [${userId}] trong CSDL.`);
  }
  await setSessionActor(dbUser);
  return dbUser;
}
