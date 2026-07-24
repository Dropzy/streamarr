export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export function redactSecret(value: string): string {
  return value.length <= 8 ? "[redacted]" : `${value.slice(0, 4)}...[redacted]`;
}
