import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/setup",
  "/booking",
  "/portal",
  "/impressum",
  "/datenschutz"
];

const PUBLIC_API_PREFIXES = [
  "/api/auth/status",
  "/api/auth/setup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/booking/request",
  "/api/portal/request"
];

const PROTECTED_PREFIXES = [
  "/api/data",
  "/api/booking/requests",
  "/api/records",
  "/api/settings",
  "/api/export",
  "/api/pdf"
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname) || startsWithAny(pathname, PUBLIC_API_PREFIXES)) {
    return NextResponse.next();
  }

  if (startsWithAny(pathname, PROTECTED_PREFIXES)) {
    const hasSession = Boolean(request.cookies.get("werkstattplan_session")?.value);
    if (!hasSession) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
