import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader title="Workspace settings" />
      <div className="grid">
        <section className="card">
          <h2>Members</h2>
          <p className="muted">Owners, administrators, editors and viewers.</p>
        </section>
        <section className="card">
          <h2>Integrations</h2>
          <p className="muted">Twitch and YouTube adapters connect here.</p>
        </section>
      </div>
    </AppShell>
  );
}
