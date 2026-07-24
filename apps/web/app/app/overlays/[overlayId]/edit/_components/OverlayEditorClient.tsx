"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
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
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);
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
  const canvas = document.canvas;

  function updateAlertLayer(nextLayer: AlertBoxLayer) {
    setDocument((current) => ({
      ...current,
      layers: current.layers.map((layer) =>
        layer.id === nextLayer.id ? nextLayer : layer,
      ),
    }));
  }

  function clampLayerPosition(layer: AlertBoxLayer, x: number, y: number) {
    return {
      x: Math.max(0, Math.min(x, canvas.width - layer.width)),
      y: Math.max(0, Math.min(y, canvas.height - layer.height)),
    };
  }

  function updateLayerGeometry(
    field: "x" | "y" | "width" | "height",
    value: string,
  ) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return;
    }

    const nextLayer = {
      ...selectedAlertLayer,
      [field]:
        field === "width" || field === "height" ? Math.max(1, parsed) : parsed,
    };
    const position = clampLayerPosition(nextLayer, nextLayer.x, nextLayer.y);

    updateAlertLayer({
      ...nextLayer,
      ...position,
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

  function handleLayerPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (selectedAlertLayer.locked) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: selectedAlertLayer.x,
      startY: selectedAlertLayer.y,
    };
  }

  function handleLayerPointerMove(event: PointerEvent<HTMLDivElement>) {
    const activeDrag = dragState.current;
    const canvasElement = canvasRef.current;

    if (
      !activeDrag ||
      activeDrag.pointerId !== event.pointerId ||
      !canvasElement
    ) {
      return;
    }

    const rect = canvasElement.getBoundingClientRect();
    const deltaX =
      ((event.clientX - activeDrag.startClientX) / rect.width) * canvas.width;
    const deltaY =
      ((event.clientY - activeDrag.startClientY) / rect.height) * canvas.height;
    const position = clampLayerPosition(
      selectedAlertLayer,
      Math.round(activeDrag.startX + deltaX),
      Math.round(activeDrag.startY + deltaY),
    );

    updateAlertLayer({
      ...selectedAlertLayer,
      ...position,
    });
  }

  function handleLayerPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null;
    }
  }

  const previewLayerStyle = {
    background: selectedAlertLayer.properties.backgroundColor,
    borderRadius: selectedAlertLayer.properties.borderRadius,
    color: selectedAlertLayer.properties.textColor,
    fontSize: selectedAlertLayer.properties.fontSize,
    fontWeight: selectedAlertLayer.properties.fontWeight,
    height: `${(selectedAlertLayer.height / canvas.height) * 100}%`,
    left: `${(selectedAlertLayer.x / canvas.width) * 100}%`,
    padding: selectedAlertLayer.properties.padding,
    textAlign: selectedAlertLayer.properties.textAlign,
    top: `${(selectedAlertLayer.y / canvas.height) * 100}%`,
    transform: `rotate(${selectedAlertLayer.rotation}deg)`,
    width: `${(selectedAlertLayer.width / canvas.width) * 100}%`,
  } as const;

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
          <div
            className="canvas"
            aria-label="Overlay canvas preview"
            ref={canvasRef}
          >
            <div
              className="layer selected"
              onPointerDown={handleLayerPointerDown}
              onPointerCancel={handleLayerPointerUp}
              onPointerMove={handleLayerPointerMove}
              onPointerUp={handleLayerPointerUp}
              style={previewLayerStyle}
            >
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
              onChange={(event) => updateLayerGeometry("x", event.target.value)}
              type="number"
              value={selectedAlertLayer.x}
            />
          </label>
          <label className="field">
            Y
            <input
              onChange={(event) => updateLayerGeometry("y", event.target.value)}
              type="number"
              value={selectedAlertLayer.y}
            />
          </label>
          <label className="field">
            Width
            <input
              min={1}
              onChange={(event) =>
                updateLayerGeometry("width", event.target.value)
              }
              type="number"
              value={selectedAlertLayer.width}
            />
          </label>
          <label className="field">
            Height
            <input
              min={1}
              onChange={(event) =>
                updateLayerGeometry("height", event.target.value)
              }
              type="number"
              value={selectedAlertLayer.height}
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
