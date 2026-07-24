import { SetupForm } from "./SetupForm";

export default function SetupPage() {
  return (
    <main className="content">
      <div className="topline">
        <div>
          <p className="muted">Installation</p>
          <h1>Create the first administrator</h1>
        </div>
      </div>
      <SetupForm />
    </main>
  );
}
