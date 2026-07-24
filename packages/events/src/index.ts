import {
  type StreamEventEnvelope,
  streamEventEnvelopeSchema,
} from "@streamarr/validation";

export function normalizeSimulatorEvent(input: unknown): StreamEventEnvelope {
  return streamEventEnvelopeSchema.parse(input);
}

export function eventIdempotencyKey(event: StreamEventEnvelope): string {
  return `${event.workspaceId}:${event.source}:${event.sourceEventId}`;
}

export function escapeTemplateValue(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function interpolateAlertTemplate(
  template: string,
  event: StreamEventEnvelope,
): string {
  const values: Record<string, unknown> = {
    "actor.displayName": event.actor.displayName,
    "event.type": event.type,
    "amount.formatted": event.amount?.formatted,
    message: event.message,
    "raid.viewerCount": event.raid?.viewerCount,
  };

  return template.replaceAll(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) =>
    escapeTemplateValue(values[key]),
  );
}
