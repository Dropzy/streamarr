export type PlatformAdapter = {
  platform: "twitch" | "youtube" | "payment_provider";
  health(): Promise<"ok" | "not_configured" | "error">;
};
