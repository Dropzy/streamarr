import { revokeSessionToken } from "@streamarr/auth";

import { getSessionToken, sessionCookieName } from "@/server/auth";
import { requireSameOrigin } from "@/server/requestGuards";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  const token = await getSessionToken();

  if (token) {
    await revokeSessionToken(token);
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      },
    },
  );
}
