import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isLoggedIn =
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");

  const pathname = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const isPublicPath = ["/", "/login", "/api/auth"].some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  // Static assets and non-auth API routes
  const isExcludedPath =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth"));

  // Skip middleware for public paths and excluded routes
  if (isPublicPath || isExcludedPath) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users accessing login to dashboard
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
