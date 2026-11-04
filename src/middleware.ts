import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "thilogi_session";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isValidSession = false;
  if (token) {
    const key = getSecretKey();
    if (key) {
      try {
        await jwtVerify(token, key, { algorithms: ["HS256"] });
        isValidSession = true;
      } catch {
        isValidSession = false;
      }
    } else {
      isValidSession = !!token;
    }
  }

  // 1. Nếu đã đăng nhập mà truy cập trang /login -> chuyển hướng thẳng vào /quotations
  if (pathname === "/login") {
    if (isValidSession) {
      return NextResponse.redirect(new URL("/quotations", request.url));
    }
    return NextResponse.next();
  }

  // 2. Chặn các đường dẫn ERP yêu cầu xác thực
  const isProtectedPath =
    pathname.startsWith("/quotations") ||
    pathname.startsWith("/rates") ||
    pathname.startsWith("/master");

  if (isProtectedPath && !isValidSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/quotations/:path*",
    "/rates/:path*",
    "/master/:path*",
    "/login",
  ],
};

