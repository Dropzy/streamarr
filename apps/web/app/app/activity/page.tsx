import { prisma } from "@streamarr/database";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentWorkspaceContext } from "@/server/workspaces";

export default async function ActivityPage() {
  const { workspace } = await getCurrentWorkspaceContext();
  const events = await prisma.streamEvent.findMany({
    where: {
      workspaceId: workspace.id,
    },
    include: {
      deliveries: {
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      receivedAt: "desc",
    },
    take: 20,
  });

  return (
    <AppShell>
      <PageHeader title="Activity feed" />
      {events.length === 0 ? (
        <section className="card">
          <h2>No events yet</h2>
          <p className="muted">
            Follow, subscription, raid and tip events will be normalized here.
          </p>
        </section>
      ) : (
        <div className="stack">
          {events.map((event) => (
            <section className="card" key={event.id}>
              <h2>{event.type}</h2>
              <p className="muted">
                {event.source} / {event.sourceEventId} received{" "}
                {event.receivedAt.toLocaleString()}
              </p>
              <p className="muted">
                {event.deliveries.length} delivery
                {event.deliveries.length === 1 ? "" : "ies"}:{" "}
                {event.deliveries.length > 0
                  ? event.deliveries
                      .map((delivery) => delivery.status.toLowerCase())
                      .join(", ")
                  : "no published browser sources"}
              </p>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
