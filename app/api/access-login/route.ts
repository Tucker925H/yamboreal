import { NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "site_access";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type AccessLoginBody = {
  password?: string;
};

export async function POST(request: Request) {
  const expectedPassword = process.env.SITE_ACCESS_PASSWORD;
  const accessToken = process.env.SITE_ACCESS_TOKEN;

  if (!expectedPassword || !accessToken) {
    return NextResponse.json(
      { error: "SITE_ACCESS_PASSWORD と SITE_ACCESS_TOKEN を設定してください。" },
      { status: 500 }
    );
  }

  let body: AccessLoginBody;
  try {
    body = (await request.json()) as AccessLoginBody;
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 }
    );
  }

  if (body.password !== expectedPassword) {
    return NextResponse.json(
      { error: "パスワードが違います。" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}
