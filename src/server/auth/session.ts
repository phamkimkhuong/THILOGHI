import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { CurrentActor } from "./types";
import { DEFAULT_SYSTEM_USER, findUserById, getActiveUsersList } from "./users";

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

export async function getSessionActor(): Promise<CurrentActor> {
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

  // Tự động chọn tài khoản đầu tiên trong CSDL hoặc tài khoản quản trị mặc định
  const activeUsers = await getActiveUsersList();
  if (activeUsers.length > 0) {
    return activeUsers[0];
  }

  return DEFAULT_SYSTEM_USER;
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
  const dbUser = await findUserById(userId);
  const targetUser = dbUser || DEFAULT_SYSTEM_USER;
  await setSessionActor(targetUser);
  return targetUser;
}
