"use client";

import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [developmentResetUrl, setDevelopmentResetUrl] = useState<string | null>(
    null,
  );
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDevelopmentResetUrl(null);
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const response = await fetch("/api/auth/forgot-password", {
      body: JSON.stringify({ email }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const body = (await response.json().catch(() => ({}))) as {
      developmentResetUrl?: string | null;
      error?: string;
      message?: string;
    };

    setSubmitting(false);

    if (!response.ok) {
      setError(body.error ?? "Could not request a password reset.");
      return;
    }

    setDevelopmentResetUrl(body.developmentResetUrl ?? null);
    setMessage(
      body.message ??
        "If that account exists, a password reset link has been generated.",
    );
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <label className="field">
        Email
        <input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="muted">{message}</p> : null}
      {developmentResetUrl ? (
        <p className="muted">
          Development reset link: <a href={developmentResetUrl}>open reset</a>
        </p>
      ) : null}
      <button className="button" disabled={submitting} type="submit">
        {submitting ? "Requesting..." : "Request reset link"}
      </button>
    </form>
  );
}
