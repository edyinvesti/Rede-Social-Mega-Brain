import { NextResponse, type NextRequest } from "next/server";
import { loginUrl, metaConfigured } from "@/lib/instagram";

export async function GET(request: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.json(
      { error: "Integração com a Meta não configurada." },
      { status: 500 },
    );
  }
  const origin = request.nextUrl.origin;
  const state = crypto.randomUUID();
  const response = NextResponse.redirect(loginUrl(origin, state));
  response.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
