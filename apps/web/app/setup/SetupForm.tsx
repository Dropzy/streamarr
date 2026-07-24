"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SetupState = {
  email: string;
  password: string;
  error: string | null;
  submitting: boolean;
};

export function SetupForm() {
  const router = useRouter();
  const [state, setState] = useState<SetupState>({
    email: "",
    password: "",
    error: null,
    submitting: false,
  });

  function updateField(field: "email" | "password", value: string) {
    setState((current) => ({
      ...current,
      [field]: value,
      error: null,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!state.email.includes("@")) {
      setState((current) => ({
        ...current,
        error: "Enter a valid email address.",
      }));
      return;
    }

    if (state.password.length < 8) {
      setState((current) => ({
        ...current,
        error: "Use at least 8 characters for the password.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      submitting: true,
    }));

    const response = await fetch("/api/setup", {
      body: JSON.stringify({
        email: state.email,
        password: state.password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setState((current) => ({
        ...current,
        error: result.error ?? "Setup failed.",
        submitting: false,
      }));
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
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="owner@example.com"
          required
          type="email"
          value={state.email}
        />
      </label>
      <label className="field">
        Password
        <input
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => updateField("password", event.target.value)}
          required
          type="password"
          value={state.password}
        />
      </label>
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="button" disabled={state.submitting} type="submit">
        {state.submitting ? "Creating..." : "Create administrator"}
      </button>
    </form>
  );
}
