import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function AdminHealthPage() {
  return (
    <AppShell>
      <PageHeader title="Health" eyebrow="Admin" />
      <section className="card">
        <h2>Readiness</h2>
        <p className="muted">
          PostgreSQL, Redis, storage and migration checks are represented by
          /health/ready.
        </p>
      </section>
    </AppShell>
  );
}
