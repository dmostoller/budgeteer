import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // Check if it's an API route (excluding auth routes)
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    // Get the session using NextAuth
    const session = await auth();

    // If no session, return unauthorized
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes except /api/auth
    "/api/((?!auth).*)",
  ],
};
