"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type AlertBoxLayer,
  type OverlayDocument,
} from "@streamarr/validation";

type SaveState = "saved" | "saving" | "error";
type PublishState = "idle" | "publishing" | "published" | "error";

export function OverlayEditorClient({
  initialDocument,
  overlayId,
  overlayName,
}: {
  initialDocument: OverlayDocument;
  overlayId: string;
  overlayName: string;
}) {
  const [document, setDocument] = useState(initialDocument);
  const [browserSourceUrl, setBrowserSourceUrl] = useState<string | null>(null);
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const alertLayer = useMemo(
    () =>
      document.layers.find((layer) => layer.type === "alert-box") as
        AlertBoxLayer | undefined,
    [document],
  );

  useEffect(() => {
    if (document === initialDocument) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSaveState("saving");

      const response = await fetch(`/api/overlays/${overlayId}/draft`, {
        body: JSON.stringify({ document }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      setSaveState(response.ok ? "saved" : "error");
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [document, initialDocument, overlayId]);

  async function saveDraftNow(): Promise<boolean> {
    setSaveState("saving");

    const response = await fetch(`/api/overlays/${overlayId}/draft`, {
      body: JSON.stringify({ document }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    setSaveState(response.ok ? "saved" : "error");
    return response.ok;
  }

  async function publishOverlay() {
    setPublishState("publishing");

    const draftSaved = await saveDraftNow();

    if (!draftSaved) {
      setPublishState("error");
      return;
    }

    const response = await fetch(`/api/overlays/${overlayId}/publish`, {
      method: "POST",
    });

    if (!response.ok) {
      setPublishState("error");
      return;
    }

    const body = (await response.json()) as {
      browserSourceUrl: string | null;
      version: {
        version: number;
      };
    };

    setBrowserSourceUrl(body.browserSourceUrl);
    setPublishedVersion(body.version.version);
    setPublishState("published");
  }

  if (!alertLayer) {
    return null;
  }

  const selectedAlertLayer = alertLayer;

  function updateAlertLayer(nextLayer: AlertBoxLayer) {
    setDocument((current) => ({
      ...current,
      layers: current.layers.map((layer) =>
        layer.id === nextLayer.id ? nextLayer : layer,
      ),
    }));
  }

  function updatePosition(field: "x" | "y", value: string) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    updateAlertLayer({
      ...selectedAlertLayer,
      [field]: parsed,
    });
  }

  function updateTemplate(
    field: "headlineTemplate" | "bodyTemplate",
    value: string,
  ) {
    updateAlertLayer({
      ...selectedAlertLayer,
      properties: {
        ...selectedAlertLayer.properties,
        [field]: value,
      },
    });
  }

  function updateDuration(value: string) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 1000) {
      return;
    }

    updateAlertLayer({
      ...selectedAlertLayer,
      properties: {
        ...selectedAlertLayer.properties,
        durationMs: parsed,
      },
    });
  }

  return (
    <main>
      <div className="toolbar">
        <strong>{overlayName}</strong>
        <span className="muted">
          {saveState === "saved"
            ? "Draft saved"
            : saveState === "saving"
              ? "Saving draft..."
              : "Save failed"}
        </span>
        <button type="button">Undo</button>
        <button type="button">Redo</button>
        <button type="button">Preview</button>
        <button
          className="button"
          disabled={publishState === "publishing"}
          onClick={publishOverlay}
          type="button"
        >
          {publishState === "publishing" ? "Publishing..." : "Publish"}
        </button>
      </div>
      {publishState === "published" ? (
        <div className="notice">
          Published version {publishedVersion}
          {browserSourceUrl ? (
            <>
              {" "}
              <a href={browserSourceUrl} rel="noreferrer" target="_blank">
                Open browser source
              </a>
            </>
          ) : (
            ". Existing browser source URL remains active."
          )}
        </div>
      ) : publishState === "error" ? (
        <div className="notice error">Publish failed.</div>
      ) : null}
      <section className="editor">
        <aside className="panel">
          <h2>Layers</h2>
          <div className="card">
            <strong>{selectedAlertLayer.name}</strong>
            <p className="muted">{selectedAlertLayer.type}</p>
          </div>
        </aside>
        <div className="canvas-wrap">
          <div className="canvas" aria-label="Overlay canvas preview">
            <div className="layer">
              <strong>{selectedAlertLayer.properties.headlineTemplate}</strong>
              <p>{selectedAlertLayer.properties.bodyTemplate}</p>
            </div>
          </div>
        </div>
        <aside className="panel inspector">
          <h2>Inspector</h2>
          <label className="field">
            Headline
            <input
              onChange={(event) =>
                updateTemplate("headlineTemplate", event.target.value)
              }
              value={selectedAlertLayer.properties.headlineTemplate}
            />
          </label>
          <label className="field">
            Body
            <input
              onChange={(event) =>
                updateTemplate("bodyTemplate", event.target.value)
              }
              value={selectedAlertLayer.properties.bodyTemplate}
            />
          </label>
          <label className="field">
            X
            <input
              onChange={(event) => updatePosition("x", event.target.value)}
              type="number"
              value={selectedAlertLayer.x}
            />
          </label>
          <label className="field">
            Y
            <input
              onChange={(event) => updatePosition("y", event.target.value)}
              type="number"
              value={selectedAlertLayer.y}
            />
          </label>
          <label className="field">
            Duration
            <input
              min={1000}
              onChange={(event) => updateDuration(event.target.value)}
              step={500}
              type="number"
              value={selectedAlertLayer.properties.durationMs}
            />
          </label>
          <label className="field">
            Entrance
            <select
              value={selectedAlertLayer.properties.entranceAnimation}
              disabled
            >
              <option>fade-in</option>
              <option>slide-up</option>
              <option>pop</option>
            </select>
          </label>
        </aside>
      </section>
    </main>
  );
}
