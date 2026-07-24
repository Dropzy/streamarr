import { prisma } from "@streamarr/database";

import { getCurrentSession } from "@/server/auth";
import {
  createBrowserSourceToken,
  hashBrowserSourceToken,
} from "@/server/browserSourceTokens";
import { requireSameOrigin } from "@/server/requestGuards";

function browserSourceUrl(request: Request, token: string): string {
  return new URL(`/source/${token}`, request.url).toString();
}

export async function POST(
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
  const token = createBrowserSourceToken();
  const tokenHash = hashBrowserSourceToken(token);

  const browserSource = await prisma.$transaction(async (tx) => {
    const overlay = await tx.overlay.findFirst({
      where: {
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
      include: {
        browserSources: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
    });

    if (!overlay) {
      return null;
    }

    const existing = overlay.browserSources[0];
    const source = existing
      ? await tx.browserSource.update({
          where: {
            id: existing.id,
          },
          data: {
            rotatedAt: new Date(),
            tokenHash,
          },
        })
      : await tx.browserSource.create({
          data: {
            overlayId: overlay.id,
            tokenHash,
          },
        });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        workspaceId: overlay.workspaceId,
        action: "browser_source.rotated",
        metadata: {
          browserSourceId: source.id,
          overlayId: overlay.id,
        },
      },
    });

    return source;
  });

  if (!browserSource) {
    return Response.json({ error: "Overlay not found." }, { status: 404 });
  }

  return Response.json({
    browserSource: {
      id: browserSource.id,
      rotatedAt: browserSource.rotatedAt?.toISOString() ?? null,
      url: browserSourceUrl(request, token),
    },
  });
}
