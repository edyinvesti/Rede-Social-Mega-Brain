import { NextResponse } from "next/server";
import { generateCarousel, type CarouselRequest } from "@/lib/generate-copy";

export async function POST(request: Request) {
  let payload: CarouselRequest;
  try {
    payload = (await request.json()) as CarouselRequest;
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

  const slideCount = Math.min(Math.max(Number(payload.slideCount) || 5, 2), 10);
  const result = await generateCarousel({ ...payload, slideCount });
  return NextResponse.json(result);
}
