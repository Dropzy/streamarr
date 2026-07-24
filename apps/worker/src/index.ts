import Redis from "ioredis";
import { WebSocket, WebSocketServer } from "ws";
import { loadConfig } from "@streamarr/config";
import {
  type BrowserSourceClientMessage,
  type BrowserSourceServerMessage,
  eventDeadLetterQueueName,
  eventDeliveryQueueName,
  hashBrowserSourceToken,
  maxDeliveryAttempts,
  recordDeliveryFailure,
  type EventDeliveryQueuePayload,
} from "@streamarr/events";
import { streamEventEnvelopeSchema } from "@streamarr/validation";
import { prisma } from "@streamarr/database";

const config = loadConfig(process.env);
const workerId = process.env.WORKER_ID ?? `worker-${process.pid}`;
const webSocketPort = Number(process.env.BROWSER_SOURCE_WS_PORT ?? 3002);
const clientsByBrowserSource = new Map<string, Set<WebSocket>>();

console.log(
  JSON.stringify({
    service: "streamarr-worker",
    status: "ready",
    redis: config.REDIS_URL,
    storage: config.STORAGE_DRIVER,
    websocketPort: webSocketPort,
  }),
);

function sendMessage(socket: WebSocket, message: BrowserSourceServerMessage) {
  if (socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  socket.send(JSON.stringify(message));
  return true;
}

async function diagnosticsMessage(): Promise<BrowserSourceServerMessage> {
  return {
    connectedSources: clientsByBrowserSource.size,
    queuedDeliveries: await prisma.eventDelivery.count({
      where: {
        status: {
          in: ["QUEUED", "WAITING_FOR_BROWSER_SOURCE", "ENQUEUE_FAILED"],
        },
      },
    }),
    type: "diagnostics",
  };
}

async function acknowledgeDelivery(deliveryId: string) {
  await prisma.eventDelivery.update({
    where: {
      id: deliveryId,
    },
    data: {
      acknowledgedAt: new Date(),
      lastError: null,
      status: "ACKNOWLEDGED",
    },
  });
}

function parseClientMessage(
  raw: WebSocket.RawData,
): BrowserSourceClientMessage | null {
  try {
    const message = JSON.parse(raw.toString()) as BrowserSourceClientMessage;

    if (
      message.type === "ack" &&
      typeof message.deliveryId === "string" &&
      message.deliveryId.length > 0
    ) {
      return message;
    }

    if (message.type === "diagnostics") {
      return message;
    }

    return null;
  } catch {
    return null;
  }
}

async function registerBrowserSource(socket: WebSocket, token: string) {
  const browserSource = await prisma.browserSource.findUnique({
    where: {
      tokenHash: hashBrowserSourceToken(
        token,
        config.BROWSER_SOURCE_TOKEN_SECRET,
      ),
    },
    select: {
      id: true,
    },
  });

  if (!browserSource) {
    socket.close(1008, "Invalid browser source token");
    return;
  }

  const clients = clientsByBrowserSource.get(browserSource.id) ?? new Set();
  clients.add(socket);
  clientsByBrowserSource.set(browserSource.id, clients);

  sendMessage(socket, await diagnosticsMessage());
  await flushPendingBrowserSourceDeliveries(browserSource.id);

  socket.on("message", (raw) => {
    const message = parseClientMessage(raw);

    if (!message) {
      return;
    }

    if (message.type === "ack") {
      acknowledgeDelivery(message.deliveryId).catch((error: unknown) => {
        console.error(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            service: "streamarr-worker",
            status: "ack_failed",
          }),
        );
      });
      return;
    }

    diagnosticsMessage()
      .then((diagnostics) => sendMessage(socket, diagnostics))
      .catch((error: unknown) => {
        console.error(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            service: "streamarr-worker",
            status: "diagnostics_failed",
          }),
        );
      });
  });

  socket.on("close", () => {
    clients.delete(socket);

    if (clients.size === 0) {
      clientsByBrowserSource.delete(browserSource.id);
    }
  });
}

async function flushPendingBrowserSourceDeliveries(browserSourceId: string) {
  const deliveries = await prisma.eventDelivery.findMany({
    where: {
      acknowledgedAt: null,
      browserSourceId,
      status: {
        in: ["ENQUEUE_FAILED", "QUEUED", "SENT", "WAITING_FOR_BROWSER_SOURCE"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      browserSourceId: true,
      id: true,
      streamEventId: true,
    },
    take: 50,
  });

  for (const delivery of deliveries) {
    await handleDelivery({
      browserSourceId: delivery.browserSourceId,
      deliveryId: delivery.id,
      streamEventId: delivery.streamEventId,
    });
  }
}

function startBrowserSourceGateway() {
  const server = new WebSocketServer({
    host: "0.0.0.0",
    port: webSocketPort,
  });

  server.on("connection", (socket, request) => {
    const url = new URL(request.url ?? "/", "ws://localhost");
    const [, route, token] = url.pathname.split("/");

    if (route !== "source" || !token) {
      socket.close(1008, "Unknown route");
      return;
    }

    registerBrowserSource(socket, token).catch((error: unknown) => {
      console.error(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          service: "streamarr-worker",
          status: "source_registration_failed",
        }),
      );
      socket.close(1011, "Registration failed");
    });
  });

  server.on("listening", () => {
    console.log(
      JSON.stringify({
        service: "streamarr-worker",
        status: "websocket_listening",
        websocketPort: webSocketPort,
      }),
    );
  });
}

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
  const delivery = await prisma.eventDelivery.findUnique({
    where: {
      id: payload.deliveryId,
    },
    include: {
      streamEvent: true,
    },
  });

  if (!delivery) {
    return;
  }

  const clients = clientsByBrowserSource.get(payload.browserSourceId);

  if (!clients || clients.size === 0) {
    await prisma.eventDelivery.update({
      where: {
        id: payload.deliveryId,
      },
      data: {
        attempts: {
          increment: 1,
        },
        lastError: "No connected browser source.",
        status: "WAITING_FOR_BROWSER_SOURCE",
      },
    });
    return;
  }

  const event = streamEventEnvelopeSchema.parse(delivery.streamEvent.payload);
  const message: BrowserSourceServerMessage = {
    deliveryId: payload.deliveryId,
    event,
    type: "alert",
  };
  const sent = [...clients].some((socket) => sendMessage(socket, message));

  await prisma.eventDelivery.update({
    where: {
      id: payload.deliveryId,
    },
    data: {
      attempts: {
        increment: 1,
      },
      lastError: sent ? null : "Browser source sockets were not open.",
      status: sent ? "SENT" : "WAITING_FOR_BROWSER_SOURCE",
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

startBrowserSourceGateway();

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
