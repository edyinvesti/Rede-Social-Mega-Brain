const GRAPH = "https://graph.facebook.com/v21.0";

/** Permissions required to read the linked IG account and publish Reels. */
export const IG_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

export function metaConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function redirectUri(origin: string): string {
  return `${origin}/api/instagram/callback`;
}

export function loginUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? "",
    redirect_uri: redirectUri(origin),
    scope: IG_SCOPES,
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

interface TokenResponse {
  access_token?: string;
  error?: { message?: string };
}

export async function exchangeCodeForToken(
  origin: string,
  code: string,
): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? "",
    client_secret: process.env.META_APP_SECRET ?? "",
    redirect_uri: redirectUri(origin),
    code,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`);
  const data = (await res.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error(data.error?.message ?? "Falha ao obter token.");
  }
  return data.access_token;
}

export async function getLongLivedToken(shortToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID ?? "",
    client_secret: process.env.META_APP_SECRET ?? "",
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`);
  const data = (await res.json()) as TokenResponse;
  return data.access_token ?? shortToken;
}

export interface InstagramAccount {
  igUserId: string;
  username: string;
}

interface PagesResponse {
  data?: Array<{ id: string; name: string }>;
  error?: { message?: string };
}

interface PageIgResponse {
  instagram_business_account?: { id: string; username?: string };
  error?: { message?: string };
}

/** Finds the first Instagram Business account linked to one of the user's Pages. */
export async function findInstagramAccount(
  token: string,
): Promise<InstagramAccount | null> {
  const res = await fetch(
    `${GRAPH}/me/accounts?fields=id,name&access_token=${token}`,
  );
  const pages = (await res.json()) as PagesResponse;
  if (!pages.data?.length) return null;
  for (const page of pages.data) {
    const igRes = await fetch(
      `${GRAPH}/${page.id}?fields=instagram_business_account{id,username}&access_token=${token}`,
    );
    const ig = (await igRes.json()) as PageIgResponse;
    if (ig.instagram_business_account?.id) {
      return {
        igUserId: ig.instagram_business_account.id,
        username: ig.instagram_business_account.username ?? "",
      };
    }
  }
  return null;
}

interface CreateContainerResponse {
  id?: string;
  error?: { message?: string };
}

/** Creates a Reels media container from a public video URL. */
export async function createReelsContainer(
  igUserId: string,
  token: string,
  videoUrl: string,
  caption: string,
): Promise<string> {
  const params = new URLSearchParams({
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    access_token: token,
  });
  const res = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    body: params,
  });
  const data = (await res.json()) as CreateContainerResponse;
  if (!data.id) {
    throw new Error(data.error?.message ?? "Falha ao criar o vídeo.");
  }
  return data.id;
}

interface ContainerStatusResponse {
  status_code?: string;
  error?: { message?: string };
}

/** Polls a media container until it finishes processing (or errors/times out). */
export async function waitForContainer(
  containerId: string,
  token: string,
  { tries = 30, delayMs = 4000 }: { tries?: number; delayMs?: number } = {},
): Promise<void> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(
      `${GRAPH}/${containerId}?fields=status_code&access_token=${token}`,
    );
    const data = (await res.json()) as ContainerStatusResponse;
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") {
      throw new Error("O Instagram não conseguiu processar o vídeo.");
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Tempo esgotado ao processar o vídeo no Instagram.");
}

interface PublishResponse {
  id?: string;
  error?: { message?: string };
}

export async function publishContainer(
  igUserId: string,
  token: string,
  containerId: string,
): Promise<string> {
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: token,
  });
  const res = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    body: params,
  });
  const data = (await res.json()) as PublishResponse;
  if (!data.id) {
    throw new Error(data.error?.message ?? "Falha ao publicar no Instagram.");
  }
  return data.id;
}
