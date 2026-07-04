import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { FriendRequest, PublicUser } from "../api/types";
import { Avatar } from "./Avatar";
import { Icon } from "../icons/Icon";

export function Friends() {
  const [friends, setFriends] = useState<PublicUser[] | null>(null);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [selected, setSelected] = useState<PublicUser | null>(null);

  async function reload() {
    const [f, r] = await Promise.all([
      api.friends().catch(() => []),
      api.friendRequests().catch(() => []),
    ]);
    setFriends(f);
    setRequests(r);
    setSelected((s) => (s && f.find((x) => x.id === s.id)) || s);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function accept(id: string) {
    await api.acceptRequest(id).catch(() => {});
    reload();
  }
  async function decline(id: string) {
    await api.declineRequest(id).catch(() => {});
    setRequests((rs) => rs.filter((r) => r.requestId !== id));
  }
  async function unfriend(userId: string) {
    await api.unfriend(userId).catch(() => {});
    setSelected(null);
    reload();
  }
  async function block(userId: string) {
    await api.block(userId).catch(() => {});
    setSelected(null);
    reload();
  }

  return (
    <div className="settings">
      <div className="settings-menu">
        <div className="settings-section-label">Friends</div>
        {requests.length > 0 && (
          <>
            <div className="settings-section-label">
              Requests ({requests.length})
            </div>
            {requests.map((r) => (
              <div className="req-row" key={r.requestId}>
                <Avatar url={null} name={r.from.displayName} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="conv-name">{r.from.displayName}</div>
                  <div className="settings-profile-user">@{r.from.username}</div>
                </div>
                <button
                  className="req-btn accept"
                  onClick={() => accept(r.requestId)}
                  title="Accept"
                >
                  <Icon name="check" size={16} />
                </button>
                <button
                  className="req-btn"
                  onClick={() => decline(r.requestId)}
                  title="Decline"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))}
            <div className="settings-section-label">All friends</div>
          </>
        )}
        {friends === null ? (
          <div className="list-empty">Loading…</div>
        ) : friends.length === 0 ? (
          <div className="list-empty">No friends yet.</div>
        ) : (
          friends.map((f) => (
            <button
              key={f.id}
              className={`settings-row ${selected?.id === f.id ? "active" : ""}`}
              onClick={() => setSelected(f)}
            >
              <Avatar url={f.avatarUrl} name={f.displayName} size="sm" />
              <span className="row-label">{f.displayName}</span>
            </button>
          ))
        )}
      </div>

      <div className="settings-detail">
        {selected ? (
          <div className="settings-detail-inner" style={{ textAlign: "center" }}>
            <Avatar url={selected.avatarUrl} name={selected.displayName} />
            <h2 className="settings-h" style={{ marginTop: 14 }}>
              {selected.displayName}
            </h2>
            <div className="settings-profile-user">@{selected.username}</div>
            {selected.about && (
              <p className="settings-sub" style={{ marginTop: 14 }}>
                {selected.about}
              </p>
            )}
            {selected.links && selected.links.length > 0 && (
              <div className="chip-list" style={{ justifyContent: "center" }}>
                {selected.links.map((l, i) => (
                  <a
                    key={i}
                    className="chip"
                    href={l}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="link" size={13} /> {l}
                  </a>
                ))}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                marginTop: 26,
              }}
            >
              <button
                className="btn-secondary"
                onClick={() => unfriend(selected.id)}
              >
                Remove friend
              </button>
              <button className="btn-secondary" onClick={() => block(selected.id)}>
                Block
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-empty">Select a friend to see their profile</div>
        )}
      </div>
    </div>
  );
}
