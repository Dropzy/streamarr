import { createUserSession, verifyPassword } from "@streamarr/auth";
import { prisma } from "@streamarr/database";

import { sessionCookieName } from "@/server/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: unknown;
    password?: unknown;
  };

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (
    !user ||
    user.suspendedAt ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    return Response.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const session = await createUserSession(user.id);

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "auth.sign_in",
      metadata: {},
    },
  });

  return Response.json(
    {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    },
    {
      headers: {
        "Set-Cookie": `${sessionCookieName}=${session.token}; Path=/; HttpOnly; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}`,
      },
    },
  );
}
