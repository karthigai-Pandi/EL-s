export function clientApiUrl(path: string) {
  const normalizedPath = path.replace(/^\//, "");
  return normalizedPath.startsWith("api/")
    ? `/${normalizedPath}`
    : `/api/${normalizedPath}`;
}

export function serverApiUrl(path: string) {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://el-s.onrender.com";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}