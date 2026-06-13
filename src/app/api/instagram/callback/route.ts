import { NextResponse, type NextRequest } from "next/server";
import {
  exchangeCodeForToken,
  findInstagramAccount,
  getLongLivedToken,
} from "@/lib/instagram";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 55,
};

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get("ig_oauth_state")?.value;
  const back = (path: string) => NextResponse.redirect(`${origin}/video${path}`);

  if (url.searchParams.get("error")) {
    return back("?ig=denied");
  }
  if (!code || !state || state !== savedState) {
    return back("?ig=error");
  }

  try {
    const shortToken = await exchangeCodeForToken(origin, code);
    const token = await getLongLivedToken(shortToken);
    const account = await findInstagramAccount(token);
    if (!account) {
      return back("?ig=noaccount");
    }
    const response = back("?ig=connected");
    response.cookies.set("ig_token", token, COOKIE_OPTS);
    response.cookies.set("ig_user_id", account.igUserId, COOKIE_OPTS);
    response.cookies.set("ig_username", account.username, {
      ...COOKIE_OPTS,
      httpOnly: false,
    });
    response.cookies.delete("ig_oauth_state");
    return response;
  } catch {
    return back("?ig=error");
  }
}
