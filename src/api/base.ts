const DEFAULT_API_BASE_URL = "/api";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  DEFAULT_API_BASE_URL;

export function apiUrl(path: string, query?: URLSearchParams | string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryString =
    typeof query === "string" ? query : query ? query.toString() : "";

  return `${API_BASE_URL}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}
