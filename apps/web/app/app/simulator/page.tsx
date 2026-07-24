import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function SimulatorPage() {
  return (
    <AppShell>
      <PageHeader title="Event simulator" />
      <section className="card">
        <h2>Synthetic follow</h2>
        <p className="muted">
          The simulator will use the same ingestion service as real
          integrations.
        </p>
        <button className="button" type="button">
          Trigger event
        </button>
      </section>
    </AppShell>
  );
}
