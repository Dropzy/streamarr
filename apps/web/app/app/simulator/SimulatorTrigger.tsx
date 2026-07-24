"use client";

import { useState } from "react";

type TriggerState = "idle" | "sending" | "sent" | "error";

export function SimulatorTrigger() {
  const [actorDisplayName, setActorDisplayName] = useState("Streamarr Viewer");
  const [message, setMessage] = useState("Thanks for testing alerts.");
  const [state, setState] = useState<TriggerState>("idle");
  const [result, setResult] = useState<string | null>(null);

  async function triggerEvent() {
    setResult(null);
    setState("sending");

    const response = await fetch("/api/events/simulator", {
      body: JSON.stringify({
        actorDisplayName,
        message,
        type: "follow",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      setState("error");
      return;
    }

    const body = (await response.json()) as {
      deliveriesQueued: number;
      event: {
        created: boolean;
        sourceEventId: string;
      };
    };

    setResult(
      `${body.event.created ? "Created" : "Deduplicated"} ${body.event.sourceEventId}; queued ${body.deliveriesQueued} delivery${body.deliveriesQueued === 1 ? "" : "ies"}.`,
    );
    setState("sent");
  }

  return (
    <section className="card stack">
      <h2>Synthetic follow</h2>
      <p className="muted">
        Simulator events use the same ingestion service as real integrations.
      </p>
      <label className="field">
        Viewer name
        <input
          onChange={(event) => setActorDisplayName(event.target.value)}
          value={actorDisplayName}
        />
      </label>
      <label className="field">
        Message
        <input
          onChange={(event) => setMessage(event.target.value)}
          value={message}
        />
      </label>
      <button
        className="button"
        disabled={state === "sending"}
        onClick={triggerEvent}
        type="button"
      >
        {state === "sending" ? "Triggering..." : "Trigger event"}
      </button>
      {state === "sent" && result ? <p className="muted">{result}</p> : null}
      {state === "error" ? (
        <p className="form-error">Could not trigger simulator event.</p>
      ) : null}
    </section>
  );
}
