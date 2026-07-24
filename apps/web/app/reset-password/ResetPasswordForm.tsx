"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/auth/reset-password", {
      body: JSON.stringify({ password, token }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setSubmitting(false);

    if (!response.ok) {
      setError(body.error ?? "Could not reset password.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  if (!token) {
    return (
      <section className="card">
        <p className="form-error">Reset token is missing.</p>
        <Link href="/forgot-password">Request a new reset link</Link>
      </section>
    );
  }

  if (success) {
    return (
      <section className="card stack">
        <p className="muted">Password has been reset.</p>
        <Link className="button" href="/sign-in">
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <label className="field">
        New password
        <input
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button" disabled={submitting} type="submit">
        {submitting ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}
