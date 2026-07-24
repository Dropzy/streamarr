function publicAppUrl(): URL {
  const url = new URL(process.env.APP_URL ?? "http://localhost:3000");

  if (process.env.NODE_ENV !== "production" && url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }

  return url;
}

export function browserSourceUrl(token: string): string {
  return new URL(`/source/${token}`, publicAppUrl()).toString();
}
