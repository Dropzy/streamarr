import { randomUUID } from "node:crypto";

import {
  enqueueEventDeliveries,
  normalizeSimulatorEvent,
  persistStreamEvent,
} from "@streamarr/events";
import { prisma } from "@streamarr/database";

import { getCurrentWorkspaceContext } from "@/server/workspaces";
import { requireSameOrigin } from "@/server/requestGuards";

const defaultActorName = "Streamarr Viewer";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);

  if (originError) {
    return originError;
  }

  const { user, workspace } = await getCurrentWorkspaceContext();
  const body = (await request.json().catch(() => ({}))) as {
    actorDisplayName?: unknown;
    message?: unknown;
    sourceEventId?: unknown;
    type?: unknown;
  };

  const eventType = body.type === "tip" ? "tip" : "follow";
  const now = new Date().toISOString();
  const sourceEventId =
    typeof body.sourceEventId === "string" && body.sourceEventId.trim()
      ? body.sourceEventId.trim()
      : `sim_${randomUUID()}`;
  const actorDisplayName =
    typeof body.actorDisplayName === "string" && body.actorDisplayName.trim()
      ? body.actorDisplayName.trim()
      : defaultActorName;
  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : null;

  const event = normalizeSimulatorEvent({
    actor: {
      avatarUrl: null,
      displayName: actorDisplayName,
      id: null,
    },
    amount:
      eventType === "tip"
        ? {
            currency: "GBP",
            formatted: "GBP 5.00",
            valueMinor: 500,
          }
        : null,
    channelId: null,
    id: `evt_${randomUUID()}`,
    message,
    metadata: {
      simulator: true,
    },
    occurredAt: now,
    raid: null,
    receivedAt: now,
    source: "simulator",
    sourceEventId,
    type: eventType,
    version: 1,
    workspaceId: workspace.id,
  });

  const result = await persistStreamEvent(event);

  if (result.created) {
    await enqueueEventDeliveries({
      deliveries: result.deliveries.map((delivery) => ({
        browserSourceId: delivery.browserSourceId,
        deliveryId: delivery.id,
        streamEventId: delivery.streamEventId,
      })),
      redisUrl: process.env.REDIS_URL ?? "",
    });

    await prisma.auditLog.create({
      data: {
        action: "event.simulator_ingested",
        actorUserId: user.id,
        metadata: {
          deliveryCount: result.deliveries.length,
          eventId: result.eventId,
          eventType: event.type,
          sourceEventId: event.sourceEventId,
        },
        workspaceId: workspace.id,
      },
    });
  }

  return Response.json({
    deliveriesQueued: result.deliveries.length,
    event: {
      id: result.eventId,
      created: result.created,
      sourceEventId: event.sourceEventId,
      type: event.type,
    },
  });
}
