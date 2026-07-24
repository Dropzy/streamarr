import { notFound } from "next/navigation";
import { prisma } from "@streamarr/database";
import { overlayDocumentSchema } from "@streamarr/validation";

import { getCurrentWorkspaceContext } from "@/server/workspaces";
import { OverlayEditorClient } from "./_components/OverlayEditorClient";

export default async function OverlayEditorPage({
  params,
}: {
  params: Promise<{ overlayId: string }>;
}) {
  const { overlayId } = await params;
  const { user } = await getCurrentWorkspaceContext();
  const overlay = await prisma.overlay.findFirst({
    where: {
      id: overlayId,
      workspace: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
    include: {
      draft: true,
    },
  });

  if (!overlay?.draft) {
    notFound();
  }

  const document = overlayDocumentSchema.parse(overlay.draft.document);

  return (
    <OverlayEditorClient
      initialDocument={document}
      overlayId={overlay.id}
      overlayName={overlay.name}
    />
  );
}
