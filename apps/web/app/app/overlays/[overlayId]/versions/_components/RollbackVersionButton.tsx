"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RollbackState = "idle" | "rolling-back" | "error";

export function RollbackVersionButton({
  overlayId,
  versionId,
}: {
  overlayId: string;
  versionId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<RollbackState>("idle");

  async function rollback() {
    setState("rolling-back");

    const response = await fetch(
      `/api/overlays/${overlayId}/versions/${versionId}/rollback`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      setState("error");
      return;
    }

    setState("idle");
    router.refresh();
  }

  return (
    <div className="stack">
      <button
        className="button secondary"
        disabled={state === "rolling-back"}
        onClick={rollback}
        type="button"
      >
        {state === "rolling-back" ? "Rolling back..." : "Rollback to this"}
      </button>
      {state === "error" ? (
        <p className="form-error">Could not rollback to this version.</p>
      ) : null}
    </div>
  );
}
