import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { NotificationPrefs } from "../../api/types";
import { PageHeader, ToggleRow } from "./ui";

export function Notifications() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    api.notificationPrefs().then(setPrefs).catch(() => setPrefs(null));
  }, []);

  async function set(key: keyof NotificationPrefs, value: boolean) {
    setPrefs((p) => (p ? { ...p, [key]: value } : p));
    const updated = await api
      .setNotificationPrefs({ [key]: value })
      .catch(() => null);
    if (updated) setPrefs(updated);
  }

  return (
    <div className="settings-detail-inner">
      <PageHeader
        title="Notifications"
        subtitle="Choose what Klic notifies you about."
      />
      {prefs === null ? (
        <div className="list-empty">Loading…</div>
      ) : (
        <>
          <ToggleRow
            label="Direct messages"
            on={prefs.messages}
            onChange={(v) => set("messages", v)}
          />
          <ToggleRow
            label="Group messages"
            on={prefs.groups}
            onChange={(v) => set("groups", v)}
          />
          <ToggleRow
            label="Calls"
            on={prefs.calls}
            onChange={(v) => set("calls", v)}
          />
          <ToggleRow
            label="Friend requests"
            on={prefs.friendRequests}
            onChange={(v) => set("friendRequests", v)}
          />
        </>
      )}
    </div>
  );
}
