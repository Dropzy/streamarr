import { overlayDocumentSchema } from "@streamarr/validation";
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

  const result = await prisma.$transaction(async (tx) => {
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
          take: 1,
        },
        draft: true,
        versions: {
          orderBy: {
            version: "desc",
          },
          select: {
            version: true,
          },
          take: 1,
        },
      },
    });

    if (!overlay?.draft) {
      return null;
    }

    const document = overlayDocumentSchema.parse(overlay.draft.document);
    const nextVersion = (overlay.versions[0]?.version ?? 0) + 1;

    const version = await tx.overlayVersion.create({
      data: {
        document,
        overlayId: overlay.id,
        version: nextVersion,
      },
    });

    await tx.overlay.update({
      where: {
        id: overlay.id,
      },
      data: {
        publishedVersionId: version.id,
      },
    });

    let createdBrowserSource = false;

    if (overlay.browserSources.length === 0) {
      await tx.browserSource.create({
        data: {
          overlayId: overlay.id,
          tokenHash,
        },
      });
      createdBrowserSource = true;
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        workspaceId: overlay.workspaceId,
        action: "overlay.published",
        metadata: {
          browserSourceCreated: createdBrowserSource,
          overlayId: overlay.id,
          versionId: version.id,
          version: version.version,
        },
      },
    });

    return {
      browserSourceUrl: createdBrowserSource
        ? browserSourceUrl(request, token)
        : null,
      version,
    };
  });

  if (!result) {
    return Response.json({ error: "Overlay not found." }, { status: 404 });
  }

  return Response.json({
    browserSourceUrl: result.browserSourceUrl,
    version: {
      id: result.version.id,
      createdAt: result.version.createdAt.toISOString(),
      version: result.version.version,
    },
  });
}
