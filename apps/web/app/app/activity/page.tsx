import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function ActivityPage() {
  return (
    <AppShell>
      <PageHeader title="Activity feed" />
      <section className="card">
        <h2>No events yet</h2>
        <p className="muted">
          Follow, subscription, raid and tip events will be normalized here.
        </p>
      </section>
    </AppShell>
  );
}
