import { prisma } from "@streamarr/database";

import { getCurrentSession } from "@/server/auth";
import { requireSameOrigin } from "@/server/requestGuards";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ overlayId: string; versionId: string }>;
  },
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

  const { overlayId, versionId } = await params;
  const result = await prisma.$transaction(async (tx) => {
    const version = await tx.overlayVersion.findFirst({
      where: {
        id: versionId,
        overlay: {
          id: overlayId,
          workspace: {
            members: {
              some: {
                userId: session.user.id,
                role: {
                  in: ["OWNER", "ADMINISTRATOR"],
                },
              },
            },
          },
        },
      },
      include: {
        overlay: true,
      },
    });

    if (!version) {
      return null;
    }

    await tx.overlay.update({
      where: {
        id: overlayId,
      },
      data: {
        publishedVersionId: version.id,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        workspaceId: version.overlay.workspaceId,
        action: "overlay.rollback",
        metadata: {
          overlayId,
          versionId,
          version: version.version,
        },
      },
    });

    return version;
  });

  if (!result) {
    return Response.json({ error: "Version not found." }, { status: 404 });
  }

  return Response.json({
    version: {
      id: result.id,
      version: result.version,
    },
  });
}
