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
