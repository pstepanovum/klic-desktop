// Thin REST client for the Klic backend with automatic silent token refresh.
import { API_BASE_URL } from "../config";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearSession,
} from "./tokens";
import type {
  AuthResponse,
  Conversation,
  Message,
  SelfUser,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Fired when the refresh token is no longer valid; the app listens and logs out.
export const onSessionExpired = new EventTarget();

// Single-flight refresh so concurrent 401s trigger only one refresh call.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as AuthResponse;
    saveTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function ensureRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean; // attach Bearer token (default true)
  query?: Record<string, string | number | undefined>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, query } = opts;

  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) {
      const token = getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await send();

  // Silent refresh + retry once on 401.
  if (res.status === 401 && auth && getRefreshToken()) {
    const refreshed = await ensureRefresh();
    if (refreshed) {
      res = await send();
    } else {
      clearSession();
      onSessionExpired.dispatchEvent(new Event("expired"));
      throw new ApiError(401, "Session expired");
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = await res.json();
      message = err.message || err.error || message;
      if (Array.isArray(err.issues) && err.issues[0]?.message) {
        message = err.issues[0].message;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // ---- Auth ----
  login(username: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { username, password },
    });
  },
  register(username: string, password: string, displayName: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: { username, password, displayName },
    });
  },
  logout(refreshToken: string) {
    return request<void>("/auth/logout", {
      method: "POST",
      auth: false,
      body: { refreshToken },
    });
  },
  me() {
    return request<SelfUser>("/users/me");
  },

  // ---- Conversations ----
  conversations() {
    return request<Conversation[]>("/conversations");
  },
  messages(conversationId: string, before?: string, limit = 50) {
    return request<Message[]>(`/conversations/${conversationId}/messages`, {
      query: { before, limit },
    });
  },
  sendMessage(conversationId: string, body: string, replyToId?: string) {
    return request<Message>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { body, replyToId },
    });
  },
};
