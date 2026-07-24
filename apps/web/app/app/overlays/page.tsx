import Link from "next/link";
import { prisma } from "@streamarr/database";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentWorkspaceContext } from "@/server/workspaces";
import { CreateOverlayButton } from "./_components/CreateOverlayButton";

export default async function OverlaysPage() {
  const { workspace } = await getCurrentWorkspaceContext();
  const overlays = await prisma.overlay.findMany({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      versions: {
        select: {
          id: true,
        },
      },
    },
  });

  return (
    <AppShell>
      <PageHeader title="Overlays" action={<CreateOverlayButton />} />
      {overlays.length === 0 ? (
        <section className="card">
          <h2>No overlays yet</h2>
          <p className="muted">
            Create a draft overlay to open the studio and start editing an alert
            box.
          </p>
        </section>
      ) : (
        <div className="grid">
          {overlays.map((overlay) => (
            <section className="card" key={overlay.id}>
              <h2>{overlay.name}</h2>
              <p className="muted">
                {overlay.versions.length} published version
                {overlay.versions.length === 1 ? "" : "s"}
              </p>
              <Link
                className="button"
                href={`/app/overlays/${overlay.id}/edit`}
              >
                Open studio
              </Link>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
