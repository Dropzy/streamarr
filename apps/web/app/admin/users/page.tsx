import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function AdminUsersPage() {
  return (
    <AppShell>
      <PageHeader title="Users" eyebrow="Admin" />
      <section className="card">
        <h2>First administrator pending</h2>
        <p className="muted">
          The setup flow will create the initial instance administrator.
        </p>
      </section>
    </AppShell>
  );
}
