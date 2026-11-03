export interface BrowserSession {
  userId: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

const storageKey = "agentvault-session-v1";
export const sessionEvent = "agentvault-session";

let cachedRaw: string | null = null;
let cachedSession: BrowserSession | null = null;

export const readBrowserSession = (): BrowserSession | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    cachedRaw = null;
    cachedSession = null;
    return null;
  }
  if (raw === cachedRaw) return cachedSession;
  try {
    const value = JSON.parse(raw) as BrowserSession;
    cachedRaw = raw;
    cachedSession = value.accessToken && value.refreshToken && value.userId ? value : null;
    return cachedSession;
  } catch {
    cachedRaw = raw;
    cachedSession = null;
    return null;
  }
};

export const writeBrowserSession = (session: BrowserSession): void => {
  localStorage.setItem(storageKey, JSON.stringify(session));
  window.dispatchEvent(new Event(sessionEvent));
};

export const clearBrowserSession = (): void => {
  localStorage.removeItem(storageKey);
  localStorage.removeItem("agentvault-access-token");
  window.dispatchEvent(new Event(sessionEvent));
};
