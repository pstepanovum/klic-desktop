// Switches the native window between a fixed, centered auth size and the
// resizable two-pane app size. No-ops gracefully outside Tauri (plain browser).
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

const AUTH = { w: 440, h: 800 };
const APP = { w: 1180, h: 760 };
const APP_MIN = { w: 720, h: 520 };

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function applyAuthWindow(): Promise<void> {
  if (!inTauri()) return;
  try {
    const win = getCurrentWindow();
    await win.setResizable(false);
    await win.setMinSize(new LogicalSize(AUTH.w, AUTH.h));
    await win.setMaxSize(new LogicalSize(AUTH.w, AUTH.h));
    await win.setSize(new LogicalSize(AUTH.w, AUTH.h));
    await win.center();
  } catch {
    /* ignore — window may not be ready */
  }
}

export async function applyAppWindow(): Promise<void> {
  if (!inTauri()) return;
  try {
    const win = getCurrentWindow();
    await win.setMaxSize(null);
    await win.setMinSize(new LogicalSize(APP_MIN.w, APP_MIN.h));
    await win.setResizable(true);
    await win.setSize(new LogicalSize(APP.w, APP.h));
    await win.center();
  } catch {
    /* ignore */
  }
}
