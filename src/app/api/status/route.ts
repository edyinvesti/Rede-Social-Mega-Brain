import { NextResponse } from "next/server";
import { activeProvider } from "@/lib/generate-copy";

export async function GET() {
  const provider = activeProvider();
  return NextResponse.json({
    aiEnabled: provider !== null,
    provider,
  });
}
