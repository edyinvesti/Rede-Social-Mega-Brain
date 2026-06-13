import { NextResponse } from "next/server";
import { generateCopy, type CopyRequest } from "@/lib/generate-copy";

export async function POST(request: Request) {
  let payload: CopyRequest;
  try {
    payload = (await request.json()) as CopyRequest;
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  if (!payload?.topic || !payload?.brand) {
    return NextResponse.json(
      { error: "Tema e dados da marca são obrigatórios." },
      { status: 400 },
    );
  }

  const result = await generateCopy(payload);
  return NextResponse.json(result);
}
