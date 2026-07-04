// Uploads bytes to a presigned URL. In the Tauri build this goes through the
// Rust HTTP plugin so the request is NOT subject to browser CORS (MinIO
// presigned PUTs otherwise fail a CORS preflight in the webview). In a plain
// browser (dev) it falls back to window.fetch.
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function putFile(
  url: string,
  contentType: string,
  file: File,
): Promise<void> {
  if (inTauri()) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const res = await tauriFetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: bytes,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  } else {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  }
}
