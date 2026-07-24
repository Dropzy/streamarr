import Redis from "ioredis";
import { loadConfig } from "@streamarr/config";
import {
  eventDeadLetterQueueName,
  eventDeliveryQueueName,
  maxDeliveryAttempts,
  recordDeliveryFailure,
  type EventDeliveryQueuePayload,
} from "@streamarr/events";
import { prisma } from "@streamarr/database";

const config = loadConfig(process.env);
const workerId = process.env.WORKER_ID ?? `worker-${process.pid}`;

console.log(
  JSON.stringify({
    service: "streamarr-worker",
    status: "ready",
    redis: config.REDIS_URL,
    storage: config.STORAGE_DRIVER,
  }),
);

async function heartbeat() {
  await prisma.workerHeartbeat.upsert({
    create: {
      metadata: {
        service: "event-delivery",
      },
      workerId,
    },
    update: {
      metadata: {
        service: "event-delivery",
      },
      seenAt: new Date(),
    },
    where: {
      workerId,
    },
  });
}

async function handleDelivery(payload: EventDeliveryQueuePayload) {
  await prisma.eventDelivery.update({
    where: {
      id: payload.deliveryId,
    },
    data: {
      attempts: {
        increment: 1,
      },
      lastError: null,
      status: "WAITING_FOR_BROWSER_SOURCE",
    },
  });
}

async function handleDeliveryFailure({
  error,
  payload,
  redis,
}: {
  error: unknown;
  payload: EventDeliveryQueuePayload;
  redis: Redis;
}) {
  const message = error instanceof Error ? error.message : String(error);
  const delivery = await recordDeliveryFailure({
    deliveryId: payload.deliveryId,
    error: message,
  });

  if (!delivery) {
    return;
  }

  if (delivery.attempts >= maxDeliveryAttempts) {
    await redis.rpush(eventDeadLetterQueueName, JSON.stringify(payload));
    return;
  }

  await redis.rpush(eventDeliveryQueueName, JSON.stringify(payload));
}

function parsePayload(raw: string): EventDeliveryQueuePayload | null {
  try {
    const payload = JSON.parse(raw) as EventDeliveryQueuePayload;

    if (
      typeof payload.browserSourceId !== "string" ||
      typeof payload.deliveryId !== "string" ||
      typeof payload.streamEventId !== "string"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function startEventDeliveryWorker() {
  const redis = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
  });

  await redis.connect();
  await heartbeat();

  setInterval(() => {
    heartbeat().catch((error: unknown) => {
      console.error(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          service: "streamarr-worker",
          status: "heartbeat_failed",
        }),
      );
    });
  }, 30_000);

  while (true) {
    const item = await redis.blpop(eventDeliveryQueueName, 5);

    if (!item) {
      continue;
    }

    const [, raw] = item;
    const payload = parsePayload(raw);

    if (!payload) {
      await redis.rpush(eventDeadLetterQueueName, raw);
      console.error(
        JSON.stringify({
          service: "streamarr-worker",
          status: "invalid_delivery_payload",
        }),
      );
      continue;
    }

    try {
      await handleDelivery(payload);
    } catch (error: unknown) {
      await handleDeliveryFailure({
        error,
        payload,
        redis,
      });
    }
  }
}

startEventDeliveryWorker().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      service: "streamarr-worker",
      status: "fatal",
    }),
  );
  process.exitCode = 1;
});
