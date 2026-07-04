// API configuration. The base URL is overridable at build time via the
// VITE_API_BASE_URL env var; it defaults to the live Klic backend.
const DEFAULT_API_BASE_URL = "https://api.klic.pstepanov.dev";

// Origin of the backend, e.g. https://api.klic.pstepanov.dev
export const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

// REST endpoints live under the versioned /api/v1 prefix.
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;

// Socket.IO connects to the bare origin (path defaults to /socket.io).
export const SOCKET_URL = API_ORIGIN;
