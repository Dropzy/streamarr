import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function MembersPage() {
  return (
    <AppShell>
      <PageHeader title="Members" />
      <section className="card">
        <h2>No invited users</h2>
        <p className="muted">
          Workspace membership enforcement belongs on every server operation.
        </p>
      </section>
    </AppShell>
  );
}
