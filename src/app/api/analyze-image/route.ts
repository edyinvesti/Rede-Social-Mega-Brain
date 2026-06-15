import { NextResponse } from "next/server";
import {
  generateCopyFromImage,
  type ImageCopyRequest,
} from "@/lib/generate-copy";

// Vercel's default body size limit is 4.5 MB; allow up to 8 MB for larger images.
export const maxDuration = 30;

export async function POST(request: Request) {
  let payload: ImageCopyRequest;
  try {
    payload = (await request.json()) as ImageCopyRequest;
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  if (!payload?.imageBase64 || !payload?.mimeType || !payload?.brand) {
    return NextResponse.json(
      { error: "imageBase64, mimeType e brand são obrigatórios." },
      { status: 400 },
    );
  }

  // Basic MIME validation
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
  if (!allowedMimes.includes(payload.mimeType)) {
    return NextResponse.json(
      { error: `Tipo de imagem não suportado: ${payload.mimeType}` },
      { status: 400 },
    );
  }

  const result = await generateCopyFromImage(payload);
  return NextResponse.json(result);
}
