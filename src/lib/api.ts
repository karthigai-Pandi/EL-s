export function clientApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function serverApiUrl(path: string) {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}