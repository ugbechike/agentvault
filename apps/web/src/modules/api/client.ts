import { apiBaseUrl } from "@/lib/format";
import {
  clearBrowserSession,
  readBrowserSession,
  writeBrowserSession,
  type BrowserSession,
} from "@/modules/session/browser-session";

interface ApiFailure {
  error?: { message?: string; issues?: { path: string; message: string }[] };
}

export const readApiError = async (response: Response): Promise<string> => {
  const body = (await response.json().catch(() => null)) as ApiFailure | null;
  return body?.error?.message ?? "The request failed.";
};

const refreshSession = async (session: BrowserSession): Promise<BrowserSession | null> => {
  const response = await fetch(`${apiBaseUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  const next = { ...session, ...body };
  writeBrowserSession(next);
  return next;
};

export const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const send = (token?: string) => {
    const headers = new Headers(init?.headers);
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
    return fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
  };
  const session = readBrowserSession();
  const response = await send(session?.accessToken);
  if (response.status !== 401 || !session || path === "/api/auth/refresh") return response;
  const refreshed = await refreshSession(session);
  if (!refreshed) {
    clearBrowserSession();
    return response;
  }
  return send(refreshed.accessToken);
};

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init);
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as T;
};
