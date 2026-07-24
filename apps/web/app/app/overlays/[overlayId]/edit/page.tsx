import { notFound } from "next/navigation";
import { prisma } from "@streamarr/database";
import { overlayDocumentSchema } from "@streamarr/validation";

import { getCurrentWorkspaceContext } from "@/server/workspaces";

export default async function OverlayEditorPage({
  params,
}: {
  params: Promise<{ overlayId: string }>;
}) {
  const { overlayId } = await params;
  const { user } = await getCurrentWorkspaceContext();
  const overlay = await prisma.overlay.findFirst({
    where: {
      id: overlayId,
      workspace: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
    include: {
      draft: true,
    },
  });

  if (!overlay?.draft) {
    notFound();
  }

  const document = overlayDocumentSchema.parse(overlay.draft.document);
  const alertLayer = document.layers.find(
    (layer) => layer.type === "alert-box",
  );

  if (!alertLayer) {
    notFound();
  }

  return (
    <main>
      <div className="toolbar">
        <strong>{overlay.name}</strong>
        <span className="muted">Draft saved to database</span>
        <button type="button">Undo</button>
        <button type="button">Redo</button>
        <button type="button">Preview</button>
        <button className="button" type="button">
          Publish
        </button>
      </div>
      <section className="editor">
        <aside className="panel">
          <h2>Layers</h2>
          <div className="card">
            <strong>{alertLayer.name}</strong>
            <p className="muted">{alertLayer.type}</p>
          </div>
        </aside>
        <div className="canvas-wrap">
          <div className="canvas" aria-label="Overlay canvas preview">
            <div className="layer">
              <strong>{alertLayer.properties.headlineTemplate}</strong>
              <p>{alertLayer.properties.bodyTemplate}</p>
            </div>
          </div>
        </div>
        <aside className="panel inspector">
          <h2>Inspector</h2>
          <label className="field">
            X
            <input value={alertLayer.x} readOnly />
          </label>
          <label className="field">
            Y
            <input value={alertLayer.y} readOnly />
          </label>
          <label className="field">
            Duration
            <input value={alertLayer.properties.durationMs} readOnly />
          </label>
          <label className="field">
            Entrance
            <select value={alertLayer.properties.entranceAnimation} disabled>
              <option>fade-in</option>
            </select>
          </label>
        </aside>
      </section>
    </main>
  );
}
