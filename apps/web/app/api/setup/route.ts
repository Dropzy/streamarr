import { NextResponse } from "next/server";

import { createUserSession, hashPassword } from "@streamarr/auth";
import { prisma } from "@streamarr/database";

import { sessionCookieName } from "@/server/auth";
import { requireSameOrigin } from "@/server/requestGuards";

const minimumPasswordLength = 8;

function redirectToSetupWithError(request: Request, error: string): Response {
  const url = new URL("/setup", request.url);
  url.searchParams.set("error", error);

  return NextResponse.redirect(url, 303);
}

function errorResponse(
  request: Request,
  error: string,
  status: number,
  nativeForm: boolean,
) {
  if (nativeForm) {
    return redirectToSetupWithError(request, error);
  }

  return Response.json({ error }, { status });
}

async function parseSetupRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      workspaceName?: unknown;
    };

    return {
      body,
      nativeForm: false,
    };
  }

  const formData = await request.formData();

  return {
    body: {
      email: formData.get("email"),
      password: formData.get("password"),
      workspaceName: formData.get("workspaceName"),
    },
    nativeForm: true,
  };
}

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  const { body, nativeForm } = await parseSetupRequest(request);

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const workspaceName =
    typeof body.workspaceName === "string" && body.workspaceName.trim()
      ? body.workspaceName.trim()
      : "Default workspace";

  if (!email.includes("@")) {
    return errorResponse(
      request,
      "Enter a valid email address.",
      400,
      nativeForm,
    );
  }

  if (password.length < minimumPasswordLength) {
    return errorResponse(
      request,
      `Use at least ${minimumPasswordLength} characters for the password.`,
      400,
      nativeForm,
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
    return errorResponse(
      request,
      "Setup has already been completed. Sign in instead.",
      409,
      nativeForm,
    );
  }

  const session = await createUserSession(user.id);
  const sessionCookie = `${sessionCookieName}=${session.token}; Path=/; HttpOnly; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}`;

  if (nativeForm) {
    const response = NextResponse.redirect(new URL("/app", request.url), 303);
    response.headers.set("Set-Cookie", sessionCookie);

    return response;
  }

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
        "Set-Cookie": sessionCookie,
      },
    },
  );
}
