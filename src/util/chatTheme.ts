// Local chat appearance (own-message bubble color). Persisted per-device and
// applied as a CSS variable override, mirroring the mobile client's local
// ChatThemeStore (global/DM themes are device-local; only group themes are
// server-backed, which is out of scope here).
const KEY = "klic.bubbleColor";

export const BUBBLE_COLORS: { id: string; color: string; name: string }[] = [
  { id: "klic", color: "#ed122b", name: "Klic Red" },
  { id: "indigo", color: "#6366f1", name: "Indigo" },
  { id: "blue", color: "#2f6bff", name: "Blue" },
  { id: "green", color: "#25a35a", name: "Green" },
  { id: "teal", color: "#0e9aa7", name: "Teal" },
  { id: "purple", color: "#8b3ddf", name: "Purple" },
  { id: "orange", color: "#f2731c", name: "Orange" },
  { id: "slate", color: "#556677", name: "Slate" },
];

export function loadBubbleColor(): string {
  return localStorage.getItem(KEY) || BUBBLE_COLORS[0].color;
}

export function applyBubbleColor(color: string): void {
  document.documentElement.style.setProperty("--bubble-out", color);
  localStorage.setItem(KEY, color);
}
