import { cookies } from "next/headers";

import { getUserBySessionToken } from "@streamarr/auth";

export const sessionCookieName = "streamarr_session";

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(sessionCookieName)?.value ?? null;
}

export async function getCurrentSession() {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  return getUserBySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  return session?.user ?? null;
}
