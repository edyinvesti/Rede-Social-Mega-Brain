import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("ig_token");
  response.cookies.delete("ig_user_id");
  response.cookies.delete("ig_username");
  return response;
}
