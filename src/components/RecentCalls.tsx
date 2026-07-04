import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { CallHistoryItem } from "../api/types";
import { Avatar } from "./Avatar";
import { Icon } from "../icons/Icon";
import { shortTime } from "../util/format";

function duration(ms?: number): string {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function RecentCalls({
  onCallBack,
}: {
  onCallBack: (conversationId: string, kind: "AUDIO" | "VIDEO", title: string) => void;
}) {
  const [calls, setCalls] = useState<CallHistoryItem[] | null>(null);

  useEffect(() => {
    api.callHistory().then(setCalls).catch(() => setCalls([]));
  }, []);

  return (
    <div className="settings">
      <div className="settings-detail" style={{ borderLeft: "none" }}>
        <div className="settings-detail-inner">
          <h2 className="settings-h">Recent calls</h2>
          <p className="settings-sub">Your call history.</p>
          {calls === null ? (
            <div className="list-empty">Loading…</div>
          ) : calls.length === 0 ? (
            <div className="list-empty">No calls yet.</div>
          ) : (
            calls.map((c) => {
              const peer = c.participants[0];
              const title =
                c.participants.length > 1
                  ? `${c.participants.length} people`
                  : peer?.displayName ?? "Unknown";
              const missed = c.outcome === "missed" || c.outcome === "declined";
              return (
                <div className="call-history-row" key={c.id}>
                  <Avatar url={peer?.avatarUrl ?? null} name={title} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="conv-name" style={{ color: missed ? "var(--danger)" : undefined }}>
                      {title}
                    </div>
                    <div className="settings-profile-user">
                      <Icon
                        name={c.outgoing ? "bold_call_calling" : "bold_phone"}
                        size={12}
                      />{" "}
                      {c.outgoing ? "Outgoing" : "Incoming"} ·{" "}
                      {c.kind === "VIDEO" ? "Video" : "Voice"}
                      {c.durationMs ? ` · ${duration(c.durationMs)}` : ""}
                    </div>
                  </div>
                  <span className="conv-time">{shortTime(c.startedAt)}</span>
                  <button
                    className="icon-btn"
                    title="Call back"
                    onClick={() => onCallBack(c.conversationId, c.kind, title)}
                  >
                    <Icon name={c.kind === "VIDEO" ? "bold_video" : "bold_phone"} size={18} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
