import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
 
import { getAuth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await getAuth();
  const isAuthenticated = !!session;
  const pathname = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const isPublicPath = [
    "/",
    "/login",
    "/api/auth",
  ].some(path => pathname === path || pathname.startsWith(path + "/"));
  
  // API routes that don't need this middleware check
  const isApiRoute = pathname.startsWith("/api/") && !pathname.startsWith("/api/auth");
  
  // Skip middleware for public paths and API routes
  if (isPublicPath || isApiRoute) {
    return NextResponse.next();
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)" // Match all paths except Next.js static files
  ],
};
