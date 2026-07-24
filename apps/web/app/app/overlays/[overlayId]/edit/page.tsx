import { defaultAlertBoxLayer } from "@streamarr/validation";

export default function OverlayEditorPage() {
  const alertLayer = defaultAlertBoxLayer;

  return (
    <main>
      <div className="toolbar">
        <strong>Starter Overlay</strong>
        <span className="muted">Draft saved locally</span>
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
