export const SESSION_STORAGE_KEY = "ovrlmt_session";

export type BrowserSession = {
  accessToken: string;
  refreshToken?: string;
  email: string;
  isAdmin: boolean;
};

export function getBrowserSession(): BrowserSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as BrowserSession;
    return parsed.accessToken && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

export function setBrowserSession(session: BrowserSession) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearBrowserSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
