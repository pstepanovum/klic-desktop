import type { ReactNode } from "react";

interface Props {
  variant?: "app" | "auth";
  right?: ReactNode;
}

// Custom titlebar used with macOS `titleBarStyle: Overlay` — the native title
// text is hidden and we draw the Klic wordmark instead. The bar is a drag
// region; native window controls (traffic lights) float in the reserved left
// inset. Interactive children opt out of dragging automatically.
export function Titlebar({ variant = "app", right }: Props) {
  return (
    <div className={`titlebar tb-${variant}`} data-tauri-drag-region>
      <div className="titlebar-spacer" data-tauri-drag-region />
      {right && <div className="titlebar-right">{right}</div>}
    </div>
  );
}
