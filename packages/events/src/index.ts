import Redis from "ioredis";
import { Prisma, prisma } from "@streamarr/database";
import {
  type StreamEventEnvelope,
  streamEventEnvelopeSchema,
} from "@streamarr/validation";

export const eventDeliveryQueueName = "streamarr:event-deliveries";
export const eventDeadLetterQueueName = "streamarr:event-deliveries:dead";
export const maxDeliveryAttempts = 5;

export type EventDeliveryQueuePayload = {
  browserSourceId: string;
  deliveryId: string;
  streamEventId: string;
};

type PersistedEventDelivery = {
  browserSourceId: string;
  id: string;
  streamEventId: string;
};

export type PersistStreamEventResult = {
  created: boolean;
  deliveries: PersistedEventDelivery[];
  eventId: string;
};

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

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function persistStreamEvent(
  event: StreamEventEnvelope,
): Promise<PersistStreamEventResult> {
  return prisma
    .$transaction(async (tx) => {
      const existing = await tx.streamEvent.findUnique({
        where: {
          workspaceId_source_sourceEventId: {
            source: event.source,
            sourceEventId: event.sourceEventId,
            workspaceId: event.workspaceId,
          },
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        return {
          created: false,
          deliveries: [],
          eventId: existing.id,
        };
      }

      const streamEvent = await tx.streamEvent.create({
        data: {
          id: event.id,
          occurredAt: new Date(event.occurredAt),
          payload: toPrismaJson(event),
          receivedAt: new Date(event.receivedAt),
          source: event.source,
          sourceEventId: event.sourceEventId,
          type: event.type,
          workspaceId: event.workspaceId,
        },
        select: {
          id: true,
        },
      });

      const browserSources = await tx.browserSource.findMany({
        where: {
          overlay: {
            publishedVersionId: {
              not: null,
            },
            workspaceId: event.workspaceId,
          },
        },
        select: {
          id: true,
        },
      });

      if (browserSources.length === 0) {
        return {
          created: true,
          deliveries: [],
          eventId: streamEvent.id,
        };
      }

      await tx.eventDelivery.createMany({
        data: browserSources.map((browserSource) => ({
          browserSourceId: browserSource.id,
          status: "QUEUED",
          streamEventId: streamEvent.id,
        })),
      });

      const deliveries = await tx.eventDelivery.findMany({
        where: {
          streamEventId: streamEvent.id,
        },
        select: {
          browserSourceId: true,
          id: true,
          streamEventId: true,
        },
      });

      return {
        created: true,
        deliveries,
        eventId: streamEvent.id,
      };
    })
    .catch(async (error: unknown) => {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await prisma.streamEvent.findUniqueOrThrow({
        where: {
          workspaceId_source_sourceEventId: {
            source: event.source,
            sourceEventId: event.sourceEventId,
            workspaceId: event.workspaceId,
          },
        },
        select: {
          id: true,
        },
      });

      return {
        created: false,
        deliveries: [],
        eventId: existing.id,
      };
    });
}

export async function enqueueEventDeliveries({
  deliveries,
  redisUrl,
}: {
  deliveries: EventDeliveryQueuePayload[];
  redisUrl: string;
}): Promise<void> {
  if (deliveries.length === 0) {
    return;
  }

  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  try {
    await redis.connect();
    await redis.rpush(
      eventDeliveryQueueName,
      ...deliveries.map((delivery) => JSON.stringify(delivery)),
    );
  } catch (error) {
    await prisma.eventDelivery.updateMany({
      where: {
        id: {
          in: deliveries.map((delivery) => delivery.deliveryId),
        },
      },
      data: {
        lastError:
          error instanceof Error ? error.message : "Redis enqueue failed.",
        status: "ENQUEUE_FAILED",
      },
    });

    throw error;
  } finally {
    redis.disconnect();
  }
}

export async function recordDeliveryFailure({
  deliveryId,
  error,
}: {
  deliveryId: string;
  error: string;
}) {
  const delivery = await prisma.eventDelivery.findUnique({
    where: {
      id: deliveryId,
    },
    select: {
      attempts: true,
    },
  });

  if (!delivery) {
    return null;
  }

  const attempts = delivery.attempts + 1;

  return prisma.eventDelivery.update({
    where: {
      id: deliveryId,
    },
    data: {
      attempts,
      lastError: error,
      status: attempts >= maxDeliveryAttempts ? "DEAD_LETTER" : "QUEUED",
    },
  });
}
