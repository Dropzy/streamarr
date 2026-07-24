import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

const links = [
  ["/app", "Dashboard"],
  ["/app/overlays", "Overlays"],
  ["/app/activity", "Activity"],
  ["/app/simulator", "Simulator"],
  ["/app/settings", "Settings"],
  ["/admin", "Admin"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">streamarr</div>
        <nav className="nav" aria-label="Primary">
          {links.map(([href, label]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <SignOutButton />
        </div>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}
