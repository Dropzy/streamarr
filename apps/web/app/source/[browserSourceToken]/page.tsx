import { defaultAlertBoxLayer } from "@streamarr/validation";

export default function BrowserSourcePage() {
  const alertLayer = defaultAlertBoxLayer;

  return (
    <main style={{ background: "transparent", minHeight: "100vh", margin: 0 }}>
      <div
        style={{
          color: alertLayer.properties.textColor,
          background: alertLayer.properties.backgroundColor,
          borderRadius: alertLayer.properties.borderRadius,
          fontSize: alertLayer.properties.fontSize,
          padding: alertLayer.properties.padding,
          position: "fixed",
          left: "28%",
          top: "38%",
          width: "44%",
          textAlign: alertLayer.properties.textAlign,
        }}
      >
        <strong>{alertLayer.properties.headlineTemplate}</strong>
        <div>{alertLayer.properties.bodyTemplate}</div>
      </div>
    </main>
  );
}
