import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["video/mp4", "video/webm"],
        maximumSizeInBytes: 200 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no upload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
