// Opens user-controlled URLs (message links, attachments, profile links) in the
// system browser instead of navigating the app webview. Only http(s) URLs are
// allowed; the shell plugin's `open` scope enforces the same rule natively.
import type { MouseEvent } from "react";
import { open } from "@tauri-apps/plugin-shell";

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// Returns the normalized URL when it is a well-formed http(s) URL, else null.
export function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

export function openExternal(raw: string | null | undefined): void {
  const url = safeHttpUrl(raw);
  if (!url) return;
  if (inTauri()) {
    open(url).catch(() => {
      /* rejected by scope or no handler — nothing else to do */
    });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// onClick handler for <a href> elements pointing at external URLs.
export function externalLinkClick(
  e: MouseEvent<HTMLElement>,
  raw: string | null | undefined,
): void {
  e.preventDefault();
  openExternal(raw);
}
