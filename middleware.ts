import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

  // If user is logged in and tries to visit login/signup → redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If no token and user tries to access protected routes → redirect to login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Allow normal request
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:path*", // protect chat pages
    "/users/:path*", // protect user management pages
    "/auth/login",
    "/auth/signup",
  ],
};
