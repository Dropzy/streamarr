"use client";

import { useState } from "react";

type RotateState = "idle" | "rotating" | "ready" | "error";

export function RotateBrowserSourceButton({
  overlayId,
}: {
  overlayId: string;
}) {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [state, setState] = useState<RotateState>("idle");

  async function rotateSource() {
    setState("rotating");

    const response = await fetch(
      `/api/overlays/${overlayId}/browser-source/rotate`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      setState("error");
      return;
    }

    const body = (await response.json()) as {
      browserSource: {
        url: string;
      };
    };

    setSourceUrl(body.browserSource.url);
    setState("ready");
  }

  return (
    <div className="stack">
      <button
        className="button"
        disabled={state === "rotating"}
        onClick={rotateSource}
        type="button"
      >
        {state === "rotating" ? "Rotating..." : "Rotate source URL"}
      </button>
      {state === "ready" && sourceUrl ? (
        <p className="muted">
          New source URL:{" "}
          <a href={sourceUrl} rel="noreferrer" target="_blank">
            {sourceUrl}
          </a>
        </p>
      ) : state === "error" ? (
        <p className="form-error">Could not rotate browser source URL.</p>
      ) : null}
    </div>
  );
}
