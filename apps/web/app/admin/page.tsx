import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function AdminPage() {
  return (
    <AppShell>
      <PageHeader title="Instance administration" eyebrow="Admin" />
      <div className="grid">
        <section className="card">
          <h2>Database</h2>
          <p className="status">Configured</p>
        </section>
        <section className="card">
          <h2>Redis</h2>
          <p className="status">Configured</p>
        </section>
        <section className="card">
          <h2>Registration</h2>
          <p className="muted">Disabled by default.</p>
        </section>
      </div>
    </AppShell>
  );
}
