import { describe, expect, it } from "vitest";
import { type StreamEventEnvelope } from "@streamarr/validation";

import { interpolateAlertTemplate } from "./index";

const baseEvent: StreamEventEnvelope = {
  id: "event_12345",
  version: 1,
  type: "follow",
  workspaceId: "workspace_1",
  channelId: null,
  source: "simulator",
  sourceEventId: "sim_1",
  occurredAt: new Date("2026-07-24T10:00:00.000Z").toISOString(),
  receivedAt: new Date("2026-07-24T10:00:01.000Z").toISOString(),
  actor: {
    id: null,
    displayName: "<script>alert(1)</script>",
    avatarUrl: null,
  },
  amount: null,
  message: "hello & welcome",
  raid: null,
  metadata: {},
};

describe("interpolateAlertTemplate", () => {
  it("interpolates supported alert variables", () => {
    expect(
      interpolateAlertTemplate(
        "{{actor.displayName}} sent {{message}}",
        baseEvent,
      ),
    ).toBe("&lt;script&gt;alert(1)&lt;/script&gt; sent hello &amp; welcome");
  });

  it("renders missing values as empty strings", () => {
    expect(
      interpolateAlertTemplate("Tip: {{amount.formatted}}", baseEvent),
    ).toBe("Tip: ");
  });
});
