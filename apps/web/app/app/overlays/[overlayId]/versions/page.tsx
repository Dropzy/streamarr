import { notFound } from "next/navigation";
import { prisma } from "@streamarr/database";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentWorkspaceContext } from "@/server/workspaces";
import { RollbackVersionButton } from "./_components/RollbackVersionButton";
import { RotateBrowserSourceButton } from "./_components/RotateBrowserSourceButton";

export default async function OverlayVersionsPage({
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
      browserSources: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
      versions: {
        orderBy: {
          version: "desc",
        },
      },
    },
  });

  if (!overlay) {
    notFound();
  }

  const source = overlay.browserSources[0];
  const hasPublishedVersion = Boolean(overlay.publishedVersionId);

  return (
    <AppShell>
      <PageHeader title={`${overlay.name} versions`} />
      <div className="stack">
        <section className="card">
          <h2>Browser source</h2>
          {source ? (
            <p className="muted">
              Source token created {source.createdAt.toLocaleString()}
              {source.rotatedAt
                ? ` and last rotated ${source.rotatedAt.toLocaleString()}`
                : ""}
              . Raw tokens are only shown when created or rotated.{" "}
              {hasPublishedVersion
                ? "This browser source has a live published version."
                : "Publish the overlay before using this browser source in OBS."}
            </p>
          ) : (
            <p className="muted">
              Publish this overlay to generate the first browser-source URL.
            </p>
          )}
          <RotateBrowserSourceButton overlayId={overlay.id} />
        </section>

        {overlay.versions.length === 0 ? (
          <section className="card">
            <h2>No published versions</h2>
            <p className="muted">
              Publishing from the studio will create immutable versions with
              audit records.
            </p>
          </section>
        ) : (
          <div className="grid">
            {overlay.versions.map((version) => (
              <section className="card" key={version.id}>
                <h2>Version {version.version}</h2>
                <p className="muted">
                  Published {version.createdAt.toLocaleString()}
                </p>
                {version.id === overlay.publishedVersionId ? (
                  <strong>Currently live</strong>
                ) : (
                  <>
                    <p className="muted">Archived</p>
                    <RollbackVersionButton
                      overlayId={overlay.id}
                      versionId={version.id}
                    />
                  </>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
