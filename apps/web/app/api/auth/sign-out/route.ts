import { revokeSessionToken } from "@streamarr/auth";

import { getSessionToken, sessionCookieName } from "@/server/auth";

export async function POST() {
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
