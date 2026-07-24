import Link from "next/link";

export default function HomePage() {
  return (
    <main className="content">
      <div className="topline">
        <div>
          <p className="muted">Self-hosted creator control centre</p>
          <h1>streamarr</h1>
        </div>
        <Link className="button" href="/setup">
          Begin setup
        </Link>
      </div>
      <div className="grid">
        <section className="card">
          <h2>Local ownership</h2>
          <p>
            Run web, worker, PostgreSQL and Redis on infrastructure you control.
          </p>
        </section>
        <section className="card">
          <h2>Overlay publishing</h2>
          <p>
            Draft overlays, publish immutable versions and serve browser-source
            routes.
          </p>
        </section>
        <section className="card">
          <h2>Operational clarity</h2>
          <p>
            Health checks, audit trails and backup paths are part of the
            foundation.
          </p>
        </section>
      </div>
    </main>
  );
}
