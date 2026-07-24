import { defaultOverlayDocument } from "@streamarr/validation";
import { prisma } from "@streamarr/database";

import { getCurrentSession } from "@/server/auth";
import { requireSameOrigin } from "@/server/requestGuards";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  const session = await getCurrentSession();

  if (!session) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const membership = session.user.memberships[0];

  if (!membership) {
    return Response.json(
      { error: "No workspace membership found." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: unknown;
  };
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : "Untitled overlay";

  const overlay = await prisma.$transaction(async (tx) => {
    const createdOverlay = await tx.overlay.create({
      data: {
        workspaceId: membership.workspaceId,
        name,
      },
    });

    await tx.overlayDraft.create({
      data: {
        overlayId: createdOverlay.id,
        document: defaultOverlayDocument,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        workspaceId: membership.workspaceId,
        action: "overlay.created",
        metadata: {
          overlayId: createdOverlay.id,
        },
      },
    });

    return createdOverlay;
  });

  return Response.json({
    overlay: {
      id: overlay.id,
      name: overlay.name,
    },
  });
}
