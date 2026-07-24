"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateOverlayButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function createOverlay() {
    setSubmitting(true);

    const response = await fetch("/api/overlays", {
      body: JSON.stringify({
        name: "Starter overlay",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      setSubmitting(false);
      return;
    }

    const result = (await response.json()) as {
      overlay: {
        id: string;
      };
    };

    router.push(`/app/overlays/${result.overlay.id}/edit`);
    router.refresh();
  }

  return (
    <button
      className="button"
      disabled={submitting}
      onClick={createOverlay}
      type="button"
    >
      {submitting ? "Creating..." : "New overlay"}
    </button>
  );
}
