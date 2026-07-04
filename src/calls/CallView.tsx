import type { Participant } from "livekit-client";
import { Icon } from "../icons/Icon";
import { useCall } from "./CallProvider";
import { CallTile } from "./CallTile";
import { gridColumns } from "./room";

function labelFor(p: Participant): string {
  return p.name || p.identity;
}

// Full-window call surface: 1:1 layout for two participants, a non-scrolling
// grid with active-speaker highlight for groups (CALLS.md §17).
export function CallView() {
  const {
    meta,
    participants,
    micOn,
    camOn,
    screenOn,
    connected,
    phase,
    toggleMic,
    toggleCam,
    toggleScreen,
    hangup,
  } = useCall();
  if (!meta) return null;

  const remotes = participants.filter((p) => !p.isLocal);
  const isGroup = remotes.length >= 2;
  const cols = gridColumns(participants.length);

  const status =
    phase === "outgoing" || !connected
      ? "Ringing…"
      : meta.isGroup
        ? `${participants.length} in call`
        : "Connected";

  return (
    <div className="call-overlay">
      <div className="call-header" data-tauri-drag-region>
        <div className="call-title">{meta.title}</div>
        <div className="call-status">{status}</div>
      </div>

      {isGroup ? (
        <div
          className="call-grid"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {participants.map((p) => (
            <CallTile
              key={p.sid || p.identity}
              participant={p}
              local={p.isLocal}
              label={labelFor(p)}
            />
          ))}
        </div>
      ) : (
        <div className="call-1to1">
          {remotes[0] ? (
            <CallTile
              participant={remotes[0]}
              local={false}
              label={labelFor(remotes[0])}
            />
          ) : (
            <div className="call-waiting">
              <div className="call-avatar big">{meta.title.charAt(0)}</div>
              <div className="call-status">Ringing…</div>
            </div>
          )}
          {participants
            .filter((p) => p.isLocal)
            .map((p) => (
              <div className="call-pip" key={p.sid || p.identity}>
                <CallTile participant={p} local label={labelFor(p)} />
              </div>
            ))}
        </div>
      )}

      <div className="call-controls">
        <button
          className={`call-ctl ${micOn ? "" : "off"}`}
          onClick={toggleMic}
          title={micOn ? "Mute" : "Unmute"}
        >
          <Icon name={micOn ? "bold_mic" : "bold_call_muted"} size={24} />
        </button>
        <button
          className={`call-ctl ${camOn ? "" : "off"}`}
          onClick={toggleCam}
          title={camOn ? "Stop video" : "Start video"}
        >
          <Icon name={camOn ? "bold_video" : "bold_camera_slash"} size={24} />
        </button>
        <button
          className={`call-ctl ${screenOn ? "on-accent" : ""}`}
          onClick={toggleScreen}
          title={screenOn ? "Stop sharing screen" : "Share screen"}
        >
          <Icon name="bold_monitor" size={24} />
        </button>
        <button className="call-ctl hangup" onClick={hangup} title="Hang up">
          <Icon name="bold_call_slash" size={24} />
        </button>
      </div>
    </div>
  );
}
