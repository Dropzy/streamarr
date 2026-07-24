"use client";

import { useEffect, useState } from "react";
import {
  type AlertBoxLayer,
  type StreamEventEnvelope,
} from "@streamarr/validation";

type ConnectionState = "connecting" | "connected" | "disconnected";

type ActiveAlert = {
  body: string;
  deliveryId: string;
  headline: string;
};

type BrowserSourceServerMessage =
  | {
      deliveryId: string;
      event: StreamEventEnvelope;
      type: "alert";
    }
  | {
      connectedSources: number;
      queuedDeliveries: number;
      type: "diagnostics";
    };

function gatewayUrl(token: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const port = process.env.NEXT_PUBLIC_BROWSER_SOURCE_WS_PORT ?? "3002";

  return `${protocol}//${window.location.hostname}:${port}/source/${token}`;
}

function escapeTemplateValue(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function interpolateAlertTemplate(
  template: string,
  event: StreamEventEnvelope,
): string {
  const values: Record<string, unknown> = {
    "actor.displayName": event.actor.displayName,
    "amount.formatted": event.amount?.formatted,
    "event.type": event.type,
    message: event.message,
    "raid.viewerCount": event.raid?.viewerCount,
  };

  return template.replaceAll(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) =>
    escapeTemplateValue(values[key]),
  );
}

export function BrowserSourceRuntime({
  alertLayer,
  token,
}: {
  alertLayer: AlertBoxLayer | null;
  token: string;
}) {
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [diagnostics, setDiagnostics] = useState<string>("Connecting");

  useEffect(() => {
    let reconnectTimer: number | undefined;
    let alertTimer: number | undefined;
    let closedByEffect = false;
    const runtimeUrl = gatewayUrl(token);

    function connect() {
      setConnectionState("connecting");
      const socket = new WebSocket(runtimeUrl);

      socket.addEventListener("open", () => {
        setConnectionState("connected");
        setDiagnostics("Connected");
        socket.send(JSON.stringify({ type: "diagnostics" }));
      });

      socket.addEventListener("message", (event) => {
        let message: BrowserSourceServerMessage;

        try {
          message = JSON.parse(event.data) as BrowserSourceServerMessage;
        } catch {
          return;
        }

        if (message.type === "diagnostics") {
          setDiagnostics(
            `${message.connectedSources} source connection${message.connectedSources === 1 ? "" : "s"}; ${message.queuedDeliveries} queued`,
          );
          return;
        }

        if (!alertLayer) {
          socket.send(
            JSON.stringify({
              deliveryId: message.deliveryId,
              type: "ack",
            }),
          );
          return;
        }

        window.clearTimeout(alertTimer);
        setActiveAlert({
          body: interpolateAlertTemplate(
            alertLayer.properties.bodyTemplate,
            message.event,
          ),
          deliveryId: message.deliveryId,
          headline: interpolateAlertTemplate(
            alertLayer.properties.headlineTemplate,
            message.event,
          ),
        });
        socket.send(
          JSON.stringify({
            deliveryId: message.deliveryId,
            type: "ack",
          }),
        );
        alertTimer = window.setTimeout(
          () => setActiveAlert(null),
          alertLayer.properties.durationMs,
        );
      });

      socket.addEventListener("close", () => {
        setConnectionState("disconnected");
        setDiagnostics("Disconnected; reconnecting");

        if (!closedByEffect) {
          reconnectTimer = window.setTimeout(connect, 1500);
        }
      });
    }

    connect();

    return () => {
      closedByEffect = true;
      window.clearTimeout(reconnectTimer);
      window.clearTimeout(alertTimer);
    };
  }, [alertLayer, token]);

  return (
    <>
      {activeAlert ? (
        <div
          className="runtime-alert"
          data-delivery-id={activeAlert.deliveryId}
        >
          <strong>{activeAlert.headline}</strong>
          <div>{activeAlert.body}</div>
        </div>
      ) : null}
      <div className="source-diagnostics" data-state={connectionState}>
        {diagnostics}
      </div>
    </>
  );
}
