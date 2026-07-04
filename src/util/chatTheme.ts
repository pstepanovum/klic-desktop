// Local chat appearance (own-message bubble color). Persisted per-device and
// applied as a CSS variable override, mirroring the mobile client's local
// ChatThemeStore (global/DM themes are device-local; only group themes are
// server-backed, which is out of scope here).
const KEY = "klic.bubbleColor";

// The curated own-bubble palette shared with the mobile apps (readable with
// white text).
export const BUBBLE_COLORS: { id: string; color: string; name: string }[] = [
  { id: "klic", color: "#ed122b", name: "Klic Red" },
  { id: "ocean", color: "#1565c0", name: "Ocean" },
  { id: "forest", color: "#2e7d32", name: "Forest" },
  { id: "violet", color: "#6a3dd8", name: "Violet" },
  { id: "sunset", color: "#e05a00", name: "Sunset" },
  { id: "graphite", color: "#455a64", name: "Graphite" },
  { id: "rose", color: "#c2185b", name: "Rose" },
];

export function loadBubbleColor(): string {
  return localStorage.getItem(KEY) || BUBBLE_COLORS[0].color;
}

export function applyBubbleColor(color: string): void {
  document.documentElement.style.setProperty("--bubble-out", color);
  localStorage.setItem(KEY, color);
}
