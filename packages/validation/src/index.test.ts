import { describe, expect, it } from "vitest";
import {
  defaultOverlayDocument,
  overlayDocumentSchema,
  streamEventEnvelopeSchema,
} from "./index";

describe("overlayDocumentSchema", () => {
  it("accepts the starter overlay", () => {
    expect(
      overlayDocumentSchema.parse(defaultOverlayDocument).schemaVersion,
    ).toBe(1);
  });
});

describe("streamEventEnvelopeSchema", () => {
  it("validates a normalized simulator event", () => {
    const event = streamEventEnvelopeSchema.parse({
      id: "event_12345",
      version: 1,
      type: "follow",
      workspaceId: "workspace_1",
      channelId: null,
      source: "simulator",
      sourceEventId: "sim_1",
      occurredAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      actor: {
        id: null,
        displayName: "Ada",
        avatarUrl: null,
      },
      amount: null,
      message: null,
      raid: null,
      metadata: {},
    });

    expect(event.type).toBe("follow");
  });
});
