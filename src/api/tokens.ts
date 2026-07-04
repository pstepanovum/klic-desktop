// Persistent token + user storage. Uses localStorage, which the Tauri webview
// keeps across app launches, so the session survives restarts.
import type { SelfUser } from "./types";

const ACCESS_KEY = "klic.accessToken";
const REFRESH_KEY = "klic.refreshToken";
const USER_KEY = "klic.user";

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SelfUser;
}

export function loadSession(): Session | null {
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  if (!accessToken || !refreshToken || !rawUser) return null;
  try {
    return { accessToken, refreshToken, user: JSON.parse(rawUser) as SelfUser };
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(ACCESS_KEY, session.accessToken);
  localStorage.setItem(REFRESH_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

// Update only the tokens (e.g. after a silent refresh) while keeping the user.
export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
