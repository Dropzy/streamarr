import { notFound } from "next/navigation";
import { prisma } from "@streamarr/database";
import {
  type AlertBoxLayer,
  type OverlayDocument,
  type OverlayLayer,
  overlayDocumentSchema,
} from "@streamarr/validation";

import { hashBrowserSourceToken } from "@/server/browserSourceTokens";
import { BrowserSourceRuntime } from "./BrowserSourceRuntime";

function layerStyle(layer: AlertBoxLayer, document: OverlayDocument) {
  return {
    background: layer.properties.backgroundColor,
    borderRadius: layer.properties.borderRadius,
    color: layer.properties.textColor,
    fontSize: layer.properties.fontSize,
    fontWeight: layer.properties.fontWeight,
    height: `${(layer.height / document.canvas.height) * 100}%`,
    left: `${(layer.x / document.canvas.width) * 100}%`,
    padding: layer.properties.padding,
    position: "absolute" as const,
    textAlign: layer.properties.textAlign,
    top: `${(layer.y / document.canvas.height) * 100}%`,
    transform: `rotate(${layer.rotation}deg)`,
    width: `${(layer.width / document.canvas.width) * 100}%`,
    zIndex: layer.zIndex,
  };
}

function baseLayerStyle(layer: OverlayLayer, document: OverlayDocument) {
  return {
    height: `${(layer.height / document.canvas.height) * 100}%`,
    left: `${(layer.x / document.canvas.width) * 100}%`,
    position: "absolute" as const,
    top: `${(layer.y / document.canvas.height) * 100}%`,
    transform: `rotate(${layer.rotation}deg)`,
    width: `${(layer.width / document.canvas.width) * 100}%`,
    zIndex: layer.zIndex,
  };
}

export default async function BrowserSourcePage({
  params,
}: {
  params: Promise<{ browserSourceToken: string }>;
}) {
  const { browserSourceToken } = await params;
  const browserSource = await prisma.browserSource.findUnique({
    where: {
      tokenHash: hashBrowserSourceToken(browserSourceToken),
    },
    include: {
      overlay: {
        select: {
          id: true,
          publishedVersionId: true,
        },
      },
    },
  });

  const publishedVersion = browserSource?.overlay.publishedVersionId
    ? await prisma.overlayVersion.findFirst({
        where: {
          id: browserSource.overlay.publishedVersionId,
          overlayId: browserSource.overlay.id,
        },
      })
    : null;

  if (!browserSource || !publishedVersion) {
    notFound();
  }

  const document = overlayDocumentSchema.parse(publishedVersion.document);
  const layers = document.layers
    .filter((layer) => layer.visible)
    .sort((left, right) => left.zIndex - right.zIndex);
  const alertLayer = layers.find((layer) => layer.type === "alert-box") ?? null;

  return (
    <main
      style={{
        background: document.canvas.background,
        height: "100vh",
        margin: 0,
        overflow: "hidden",
        position: "relative",
        width: "100vw",
      }}
    >
      {layers.map((layer) =>
        layer.type === "alert-box" ? (
          <div key={layer.id} style={layerStyle(layer, document)}>
            <strong>{layer.properties.headlineTemplate}</strong>
            <div>{layer.properties.bodyTemplate}</div>
          </div>
        ) : layer.type === "text" ? (
          <div
            key={layer.id}
            style={{
              ...baseLayerStyle(layer, document),
              color: layer.properties.color,
              fontSize: layer.properties.fontSize,
            }}
          >
            {layer.properties.text}
          </div>
        ) : (
          <div
            key={layer.id}
            style={{
              ...baseLayerStyle(layer, document),
              background: layer.properties.fill,
              border: layer.properties.border,
              borderRadius: layer.properties.radius,
            }}
          />
        ),
      )}
      <BrowserSourceRuntime
        alertLayer={alertLayer}
        token={browserSourceToken}
      />
    </main>
  );
}
