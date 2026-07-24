import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function AdminAuditPage() {
  return (
    <AppShell>
      <PageHeader title="Audit log" eyebrow="Admin" />
      <section className="card">
        <h2>No audit events</h2>
        <p className="muted">
          Authentication, publishing and administration actions will be recorded
          here.
        </p>
      </section>
    </AppShell>
  );
}
