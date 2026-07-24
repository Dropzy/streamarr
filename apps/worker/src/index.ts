import { loadConfig } from "@streamarr/config";

const config = loadConfig(process.env);

console.log(
  JSON.stringify({
    service: "streamarr-worker",
    status: "ready",
    redis: config.REDIS_URL,
    storage: config.STORAGE_DRIVER,
  }),
);
