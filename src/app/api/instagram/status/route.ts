import { NextResponse, type NextRequest } from "next/server";
import { metaConfigured } from "@/lib/instagram";

export async function GET(request: NextRequest) {
  const connected = Boolean(request.cookies.get("ig_token")?.value);
  return NextResponse.json({
    configured: metaConfigured(),
    connected,
    username: request.cookies.get("ig_username")?.value ?? null,
  });
}
