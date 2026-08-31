/**
 * API client.
 *
 * All data comes from the Express API (hosted on Render).
 * Set VITE_API_URL in Netlify (and in .env locally) to the API's public URL,
 * e.g. https://sba2012-api.onrender.com
 */
export const API = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const TOKEN_KEY = "sba_admin_token";

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** fetch() with the API base + admin bearer token attached. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${API}${path}`, { ...init, headers });
}

/** Resolve a stored file name (e.g. "news-2026..jpg") to its API URL. */
export function fileUrl(name?: string | null): string {
  if (!name) return "";
  if (/^https?:\/\//.test(name)) return name;
  return `${API}/file/${encodeURIComponent(name)}`;
}
