import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/server/auth";

const cards = [
  [
    "Channel",
    "No platform connected",
    "Connect Twitch or YouTube from integrations.",
  ],
  [
    "Browser source",
    "Waiting",
    "Publish an overlay to activate a tokenized source URL.",
  ],
  [
    "Recent events",
    "0 events",
    "Synthetic events will appear here during simulator testing.",
  ],
  [
    "Goals",
    "No active goal",
    "Create a goal widget once workspace storage is configured.",
  ],
] as const;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        action={<span className="status">{user?.email}</span>}
      />
      <div className="grid">
        {cards.map(([title, value, detail]) => (
          <section className="card" key={title}>
            <h2>{title}</h2>
            <strong>{value}</strong>
            <p>{detail}</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
