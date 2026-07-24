import { createUserSession, hashPassword } from "@streamarr/auth";
import { prisma } from "@streamarr/database";

import { sessionCookieName } from "@/server/auth";
import { requireSameOrigin } from "@/server/requestGuards";

const minimumPasswordLength = 8;

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  const body = (await request.json()) as {
    email?: unknown;
    password?: unknown;
    workspaceName?: unknown;
  };

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const workspaceName =
    typeof body.workspaceName === "string" && body.workspaceName.trim()
      ? body.workspaceName.trim()
      : "Default workspace";

  if (!email.includes("@")) {
    return Response.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  if (password.length < minimumPasswordLength) {
    return Response.json(
      {
        error: `Use at least ${minimumPasswordLength} characters for the password.`,
      },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma
    .$transaction(
      async (tx) => {
        const existingUsers = await tx.user.count();

        if (existingUsers > 0) {
          throw new Error("SETUP_ALREADY_COMPLETED");
        }

        const createdUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: "INSTANCE_ADMIN",
          },
        });

        const workspace = await tx.workspace.create({
          data: {
            name: workspaceName,
            slug: "default",
          },
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: createdUser.id,
            role: "OWNER",
          },
        });

        await tx.instanceSetting.createMany({
          data: [
            { key: "setup.completed", value: true },
            { key: "registration.enabled", value: false },
          ],
          skipDuplicates: true,
        });

        await tx.auditLog.create({
          data: {
            actorUserId: createdUser.id,
            action: "setup.completed",
            metadata: {
              workspaceId: workspace.id,
            },
          },
        });

        return createdUser;
      },
      {
        isolationLevel: "Serializable",
      },
    )
    .catch((error: unknown) => {
      if (
        error instanceof Error &&
        error.message === "SETUP_ALREADY_COMPLETED"
      ) {
        return null;
      }

      throw error;
    });

  if (!user) {
    return Response.json(
      { error: "Setup has already been completed. Sign in instead." },
      { status: 409 },
    );
  }

  const session = await createUserSession(user.id);

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
