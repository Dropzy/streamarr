import { hashPassword, hashPasswordResetToken } from "@streamarr/auth";
import { prisma } from "@streamarr/database";

import {
  checkRateLimit,
  clientKey,
  requireSameOrigin,
} from "@/server/requestGuards";

const minimumPasswordLength = 8;

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  const rateLimitError = checkRateLimit({
    key: clientKey(request, "reset-password"),
    limit: 8,
    windowMs: 1000 * 60 * 15,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  const body = (await request.json().catch(() => ({}))) as {
    password?: unknown;
    token?: unknown;
  };
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (password.length < minimumPasswordLength) {
    return Response.json(
      {
        error: `Use at least ${minimumPasswordLength} characters for the password.`,
      },
      { status: 400 },
    );
  }

  const tokenHash = hashPasswordResetToken(token);
  const passwordHash = await hashPassword(password);
  const result = await prisma.$transaction(async (tx) => {
    const resetToken = await tx.passwordResetToken.findFirst({
      where: {
        expiresAt: {
          gt: new Date(),
        },
        tokenHash,
        usedAt: null,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!resetToken) {
      return null;
    }

    await tx.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        passwordHash,
      },
    });

    await tx.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    await tx.session.updateMany({
      where: {
        userId: resetToken.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        action: "auth.password_reset_completed",
        actorUserId: resetToken.userId,
        metadata: {
          resetTokenId: resetToken.id,
        },
      },
    });

    return {
      userId: resetToken.userId,
    };
  });

  if (!result) {
    return Response.json(
      { error: "Reset link is invalid or expired." },
      { status: 400 },
    );
  }

  return Response.json({
    message: "Password has been reset. Sign in with the new password.",
  });
}
