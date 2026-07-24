import { z } from "zod";

const baseLayerSchema = z.object({
  id: z.string().min(8),
  name: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  zIndex: z.number().int(),
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
});

export const alertBoxLayerSchema = baseLayerSchema.extend({
  type: z.literal("alert-box"),
  properties: z.object({
    enabledEventTypes: z.array(
      z.enum(["follow", "subscription", "raid", "tip"]),
    ),
    headlineTemplate: z.string(),
    bodyTemplate: z.string(),
    textAlign: z.enum(["left", "center", "right"]).default("center"),
    fontSize: z.number().int().positive(),
    fontWeight: z.enum(["400", "500", "600", "700"]),
    textColor: z.string(),
    backgroundColor: z.string(),
    borderRadius: z.number().nonnegative(),
    padding: z.number().nonnegative(),
    mediaUrl: z.string().url().or(z.literal("")),
    soundUrl: z.string().url().or(z.literal("")),
    volume: z.number().min(0).max(1),
    durationMs: z.number().int().positive(),
    entranceAnimation: z.enum(["fade-in", "slide-up", "pop"]),
    exitAnimation: z.enum(["fade-out", "slide-down"]),
    minimumTipAmountMinor: z.number().int().nonnegative(),
    textToSpeechEnabled: z.boolean(),
  }),
});

export const textLayerSchema = baseLayerSchema.extend({
  type: z.literal("text"),
  properties: z.object({
    text: z.string(),
    fontSize: z.number().int().positive(),
    color: z.string(),
  }),
});

export const shapeLayerSchema = baseLayerSchema.extend({
  type: z.literal("shape"),
  properties: z.object({
    fill: z.string(),
    border: z.string(),
    radius: z.number().nonnegative(),
  }),
});

export const overlayLayerSchema = z.discriminatedUnion("type", [
  alertBoxLayerSchema,
  textLayerSchema,
  shapeLayerSchema,
]);

export const overlayDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  canvas: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    background: z.string(),
  }),
  layers: z.array(overlayLayerSchema),
});

export type OverlayDocument = z.infer<typeof overlayDocumentSchema>;
export type OverlayLayer = z.infer<typeof overlayLayerSchema>;
export type AlertBoxLayer = z.infer<typeof alertBoxLayerSchema>;

export const streamEventEnvelopeSchema = z.object({
  id: z.string().min(8),
  version: z.literal(1),
  type: z.enum(["follow", "subscription", "raid", "tip"]),
  workspaceId: z.string().min(1),
  channelId: z.string().min(1).nullable(),
  source: z.enum(["simulator", "twitch", "youtube", "payment_provider"]),
  sourceEventId: z.string().min(1),
  occurredAt: z.string().datetime(),
  receivedAt: z.string().datetime(),
  actor: z.object({
    id: z.string().nullable(),
    displayName: z.string().min(1),
    avatarUrl: z.string().url().nullable(),
  }),
  amount: z
    .object({
      valueMinor: z.number().int(),
      currency: z.string().min(3).max(3),
      formatted: z.string(),
    })
    .nullable(),
  message: z.string().nullable(),
  raid: z
    .object({
      viewerCount: z.number().int().nonnegative(),
    })
    .nullable(),
  metadata: z.record(z.unknown()),
});

export type StreamEventEnvelope = z.infer<typeof streamEventEnvelopeSchema>;

export const defaultAlertBoxLayer: AlertBoxLayer = alertBoxLayerSchema.parse({
  id: "starter-alert",
  type: "alert-box",
  name: "Alert box",
  x: 520,
  y: 360,
  width: 880,
  height: 260,
  rotation: 0,
  zIndex: 1,
  locked: false,
  visible: true,
  properties: {
    enabledEventTypes: ["follow", "subscription", "raid", "tip"],
    headlineTemplate: "{{actor.displayName}} just followed",
    bodyTemplate: "Welcome to the stream",
    textAlign: "center",
    fontSize: 42,
    fontWeight: "700",
    textColor: "#f4f7fb",
    backgroundColor: "rgba(13, 17, 23, 0.78)",
    borderRadius: 18,
    padding: 24,
    mediaUrl: "",
    soundUrl: "",
    volume: 0.8,
    durationMs: 5000,
    entranceAnimation: "fade-in",
    exitAnimation: "fade-out",
    minimumTipAmountMinor: 0,
    textToSpeechEnabled: false,
  },
});

export const defaultOverlayDocument: OverlayDocument =
  overlayDocumentSchema.parse({
    schemaVersion: 1,
    canvas: {
      width: 1920,
      height: 1080,
      background: "transparent",
    },
    layers: [defaultAlertBoxLayer],
  });
