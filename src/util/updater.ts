// Tauri auto-updater wrapper. Checks the GitHub Releases feed for a newer,
// signed build; downloads + verifies + installs it, then relaunches. Safe to
// call in a plain browser (dev) — it just reports "unavailable".
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export interface UpdateInfo {
  version: string;
  notes?: string;
  update: Update;
}

export type UpdateState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; info: UpdateInfo }
  | { kind: "downloading"; version: string; percent: number }
  | { kind: "ready" }
  | { kind: "uptodate" }
  | { kind: "error"; message: string };

// Returns the available update, or null when up to date / not in Tauri.
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (!inTauri()) return null;
  const update = await check();
  if (!update) return null;
  return { version: update.version, notes: update.body, update };
}

// Downloads + installs the update, reporting download progress, then relaunches.
export async function installUpdate(
  info: UpdateInfo,
  onProgress?: (percent: number) => void,
): Promise<void> {
  let downloaded = 0;
  let total = 0;
  await info.update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        total = event.data.contentLength ?? 0;
        break;
      case "Progress":
        downloaded += event.data.chunkLength;
        if (total > 0 && onProgress) {
          onProgress(Math.min(100, Math.round((downloaded / total) * 100)));
        }
        break;
      case "Finished":
        onProgress?.(100);
        break;
    }
  });
  await relaunch();
}

// True when the current runtime can auto-update (packaged Tauri app).
export function updaterAvailable(): boolean {
  return inTauri();
}
