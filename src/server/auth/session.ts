import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { CurrentActor } from "./types";
import { findUserById } from "./users";

const SESSION_COOKIE_NAME = "thilogi_session";
function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET phải có ít nhất 32 ký tự.");
  return new TextEncoder().encode(secret);
}

export function isDemoAuthEnabled(): boolean {
  return process.env.ENABLE_DEMO_AUTH === "true";
}

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
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<CurrentActor | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
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
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
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
  if (!isDemoAuthEnabled()) {
    throw new Error(
      "Từ chối quyền (403): Chức năng chuyển đổi tài khoản (impersonation) chỉ được dùng khi bật ENABLE_DEMO_AUTH."
    );
  }

  const dbUser = await findUserById(userId);
  if (!dbUser) {
    throw new Error(`Không tìm thấy người dùng [${userId}] trong CSDL.`);
  }
  await setSessionActor(dbUser);
  return dbUser;
}

export async function clearSessionActor(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
