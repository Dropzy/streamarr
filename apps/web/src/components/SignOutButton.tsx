"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function signOut() {
    setSubmitting(true);

    await fetch("/api/auth/sign-out", {
      method: "POST",
    });

    router.push("/sign-in");
    router.refresh();
  }

  return (
    <button
      className="nav-button"
      disabled={submitting}
      onClick={signOut}
      type="button"
    >
      {submitting ? "Signing out..." : "Sign out"}
    </button>
  );
}
