"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/auth/sign-in", {
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Sign-in failed.");
      setSubmitting(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
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
      <label className="field">
        Password
        <input
          autoComplete="current-password"
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
        {submitting ? "Signing in..." : "Sign in"}
      </button>
      <p className="muted">
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
    </form>
  );
}
