import {
  createPasswordResetToken,
  hashPasswordResetToken,
} from "@streamarr/auth";
import { prisma } from "@streamarr/database";

import {
  checkRateLimit,
  clientKey,
  requireSameOrigin,
} from "@/server/requestGuards";

const resetTokenLifetimeMs = 1000 * 60 * 30;

function resetUrl(request: Request, token: string): string {
  return new URL(`/reset-password?token=${token}`, request.url).toString();
}

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  const rateLimitError = checkRateLimit({
    key: clientKey(request, "forgot-password"),
    limit: 5,
    windowMs: 1000 * 60 * 15,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: unknown;
  };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const user = email
    ? await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
        },
      })
    : null;

  let developmentResetUrl: string | null = null;

  if (user) {
    const token = createPasswordResetToken();
    const expiresAt = new Date(Date.now() + resetTokenLifetimeMs);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.passwordResetToken.create({
        data: {
          expiresAt,
          tokenHash: hashPasswordResetToken(token),
          userId: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "auth.password_reset_requested",
          actorUserId: user.id,
          metadata: {
            email: user.email,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });
    });

    if (!process.env.SMTP_HOST) {
      developmentResetUrl = resetUrl(request, token);
      console.info(
        JSON.stringify({
          resetUrl: developmentResetUrl,
          service: "streamarr-web",
          status: "password_reset_link_created",
        }),
      );
    }
  }

  return Response.json({
    developmentResetUrl,
    message:
      "If that account exists, a password reset link has been generated.",
  });
}
