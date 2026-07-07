import type { ScreenShareCaptureOptions } from "livekit-client";
import { Icon } from "../icons/icon";
import { useCall } from "./call-provider";

// Surface choices we can express through getDisplayMedia's `displaySurface`
// hint. The WKWebView on macOS has no built-in source chooser, so this modal
// makes the intent explicit and passes the matching constraint through to
// LiveKit (see call-provider.startScreenShare). A true per-window / per-app
// picker requires the native ScreenCaptureKit picker — see README notes.
interface SourceOption {
  id: "monitor" | "window";
  label: string;
  sub: string;
  icon: "bold_monitor" | "bold_copy";
  options: ScreenShareCaptureOptions;
}

const SOURCES: SourceOption[] = [
  {
    id: "monitor",
    label: "Entire screen",
    sub: "Share everything on a display",
    icon: "bold_monitor",
    options: {
      audio: true,
      systemAudio: "include",
      surfaceSwitching: "include",
      selfBrowserSurface: "exclude",
      video: { displaySurface: "monitor" },
      contentHint: "detail",
    },
  },
  {
    id: "window",
    label: "A window",
    sub: "Share a single app window",
    icon: "bold_copy",
    options: {
      audio: true,
      systemAudio: "include",
      surfaceSwitching: "include",
      selfBrowserSurface: "exclude",
      video: { displaySurface: "window" },
      contentHint: "detail",
    },
  },
];

export function ScreenSharePicker() {
  const { screenPickerOpen, startScreenShare, cancelScreenShare } = useCall();
  if (!screenPickerOpen) return null;

  return (
    <div
      className="ss-picker"
      role="dialog"
      aria-modal="true"
      aria-label="Choose what to share"
      onClick={cancelScreenShare}
    >
      <div className="ss-picker-card" onClick={(e) => e.stopPropagation()}>
        <div className="ss-picker-title">Share your screen</div>
        <div className="ss-picker-sub">
          Choose what to share. macOS may ask for Screen Recording permission
          the first time.
        </div>
        <div className="ss-picker-grid">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              className="ss-source"
              onClick={() => startScreenShare(s.options)}
            >
              <span className="ss-source-icon">
                <Icon name={s.icon} size={26} />
              </span>
              <span className="ss-source-label">{s.label}</span>
              <span className="ss-source-sub">{s.sub}</span>
            </button>
          ))}
        </div>
        <button className="ss-picker-cancel" onClick={cancelScreenShare}>
          Cancel
        </button>
      </div>
    </div>
  );
}
