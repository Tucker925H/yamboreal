import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "site_access";
const PUBLIC_PATHS = new Set(["/access", "/favicon.ico", "/sw.js"]);

const hasPublicAssetExtension = (pathname: string) =>
  pathname.endsWith(".png") ||
  pathname.endsWith(".jpg") ||
  pathname.endsWith(".jpeg") ||
  pathname.endsWith(".gif") ||
  pathname.endsWith(".svg") ||
  pathname.endsWith(".webp") ||
  pathname.endsWith(".ico") ||
  pathname.endsWith(".css") ||
  pathname.endsWith(".js") ||
  pathname.endsWith(".txt") ||
  pathname.endsWith(".xml") ||
  pathname.endsWith(".json");

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_PATHS.has(pathname) ||
    hasPublicAssetExtension(pathname)
  ) {
    return NextResponse.next();
  }

  const expectedToken = process.env.SITE_ACCESS_TOKEN;
  const accessCookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (expectedToken && accessCookie === expectedToken) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/access";
  redirectUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: "/:path*",
};
