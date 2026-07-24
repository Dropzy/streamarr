import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function OverlaysPage() {
  return (
    <AppShell>
      <PageHeader
        title="Overlays"
        action={
          <Link className="button" href="/app/overlays/demo/edit">
            Open studio
          </Link>
        }
      />
      <section className="card">
        <h2>Draft overlay</h2>
        <p className="muted">
          A starter alert-box layout is ready for schema and persistence wiring.
        </p>
      </section>
    </AppShell>
  );
}
