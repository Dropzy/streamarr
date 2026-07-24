import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function IntegrationsPage() {
  return (
    <AppShell>
      <PageHeader title="Integrations" />
      <section className="card">
        <h2>Disconnected</h2>
        <p className="muted">
          OAuth adapters will be optional and configured through environment
          settings.
        </p>
      </section>
    </AppShell>
  );
}
