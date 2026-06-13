import { NextResponse, type NextRequest } from "next/server";
import {
  createReelsContainer,
  publishContainer,
  waitForContainer,
} from "@/lib/instagram";

interface PublishBody {
  videoUrl?: string;
  caption?: string;
}

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const token = request.cookies.get("ig_token")?.value;
  const igUserId = request.cookies.get("ig_user_id")?.value;
  if (!token || !igUserId) {
    return NextResponse.json(
      { error: "Conecte sua conta do Instagram primeiro." },
      { status: 401 },
    );
  }

  let body: PublishBody;
  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.videoUrl) {
    return NextResponse.json(
      { error: "Vídeo não informado." },
      { status: 400 },
    );
  }

  try {
    const containerId = await createReelsContainer(
      igUserId,
      token,
      body.videoUrl,
      body.caption ?? "",
    );
    await waitForContainer(containerId, token);
    const mediaId = await publishContainer(igUserId, token, containerId);
    return NextResponse.json({ ok: true, mediaId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Falha ao publicar no Instagram.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
