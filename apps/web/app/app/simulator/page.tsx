import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SimulatorTrigger } from "./SimulatorTrigger";

export default function SimulatorPage() {
  return (
    <AppShell>
      <PageHeader title="Event simulator" />
      <SimulatorTrigger />
    </AppShell>
  );
}
