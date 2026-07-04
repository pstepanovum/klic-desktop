import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { StarredMessage } from "../../api/types";
import { clockTime } from "../../util/format";
import { PageHeader } from "./ui";

export function SavedMessages() {
  const [items, setItems] = useState<StarredMessage[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(next?: string) {
    setLoading(true);
    try {
      const page = await api.starred(next);
      setItems((prev) => (next && prev ? [...prev, ...page.items] : page.items));
      setCursor(page.nextCursor);
    } catch {
      setItems((prev) => prev ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="settings-detail-inner">
      <PageHeader
        title="Saved messages"
        subtitle="Messages you starred across your chats."
      />
      {items === null ? (
        <div className="list-empty">Loading…</div>
      ) : items.length === 0 ? (
        <div className="list-empty">No saved messages yet.</div>
      ) : (
        <>
          {items.map((m) => (
            <div className="saved-item" key={m.id}>
              <div className="si-top">
                <span>
                  {m.sender?.displayName ?? "You"}
                  {m.conversation?.title ? ` · ${m.conversation.title}` : ""}
                </span>
                <span>{clockTime(m.createdAt)}</span>
              </div>
              <div className="bubble-text" style={{ fontSize: 14 }}>
                {m.body || "(attachment)"}
              </div>
            </div>
          ))}
          {cursor && (
            <button
              className="btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => load(cursor)}
              disabled={loading}
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
