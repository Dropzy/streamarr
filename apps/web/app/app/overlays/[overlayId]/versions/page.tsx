import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function OverlayVersionsPage() {
  return (
    <AppShell>
      <PageHeader title="Overlay versions" />
      <section className="card">
        <h2>No published versions</h2>
        <p className="muted">
          Publishing will create immutable versions with audit records.
        </p>
      </section>
    </AppShell>
  );
}
