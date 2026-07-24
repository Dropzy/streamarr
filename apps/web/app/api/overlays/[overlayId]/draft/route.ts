import { overlayDocumentSchema } from "@streamarr/validation";
import { prisma } from "@streamarr/database";

import { getCurrentSession } from "@/server/auth";
import { requireSameOrigin } from "@/server/requestGuards";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ overlayId: string }> },
) {
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

  const { overlayId } = await params;
  const body = (await request.json()) as {
    document?: unknown;
  };
  const documentResult = overlayDocumentSchema.safeParse(body.document);

  if (!documentResult.success) {
    return Response.json(
      {
        error: "Invalid overlay document.",
        issues: documentResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const overlay = await prisma.overlay.findFirst({
    where: {
      id: overlayId,
      workspace: {
        members: {
          some: {
            userId: session.user.id,
            role: {
              in: ["OWNER", "ADMINISTRATOR", "EDITOR"],
            },
          },
        },
      },
    },
    select: {
      id: true,
      workspaceId: true,
    },
  });

  if (!overlay) {
    return Response.json({ error: "Overlay not found." }, { status: 404 });
  }

  const draft = await prisma.overlayDraft.update({
    where: {
      overlayId: overlay.id,
    },
    data: {
      document: documentResult.data,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      workspaceId: overlay.workspaceId,
      action: "overlay.draft_updated",
      metadata: {
        overlayId: overlay.id,
        draftId: draft.id,
      },
    },
  });

  return Response.json({
    draft: {
      id: draft.id,
      updatedAt: draft.updatedAt.toISOString(),
    },
  });
}
