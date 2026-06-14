import { NextResponse } from "next/server";
import { generateCalendar, type CalendarRequest } from "@/lib/generate-copy";

export async function POST(request: Request) {
  let payload: CalendarRequest;
  try {
    payload = (await request.json()) as CalendarRequest;
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  if (!payload?.niche || !payload?.brand) {
    return NextResponse.json(
      { error: "Nicho e dados da marca são obrigatórios." },
      { status: 400 },
    );
  }

  const days = Math.min(Math.max(Number(payload.days) || 7, 3), 14);
  const result = await generateCalendar({ ...payload, days });
  return NextResponse.json(result);
}
