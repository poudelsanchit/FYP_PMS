import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./core/lib/prisma/prisma";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets & Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Get JWT from cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Refresh token data from database on every request
  if (token?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: token.email as string },
    });
    if (dbUser) {
      token.isVerified = dbUser.isVerified;
    }
  }
  if (token && (pathname === "/" || pathname.startsWith("/auth"))) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (
    token &&
    !token.isVerified &&
    (pathname.startsWith("/auth") || pathname.startsWith("/app"))
  ) {
    return NextResponse.redirect(new URL("/verification", request.url));
  }
  if (!token && (pathname.startsWith("/app") || pathname === "/verification")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  return NextResponse.next();
}
