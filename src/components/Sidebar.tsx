import type { Conversation, SelfUser } from "../api/types";
import { Avatar } from "./Avatar";
import {
  conversationTitle,
  conversationAvatar,
  messagePreview,
  shortTime,
} from "../util/format";
import { Theme, themeIcon } from "../util/theme";

interface Props {
  me: SelfUser;
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  theme: Theme;
  onSelect: (id: string) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export function Sidebar({
  me,
  conversations,
  activeId,
  loading,
  theme,
  onSelect,
  onToggleTheme,
  onLogout,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="me">
          <Avatar url={me.avatarUrl} name={me.displayName} size="sm" />
          <span className="me-name">{me.displayName}</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <button
            className="icon-btn"
            title="Toggle theme"
            onClick={onToggleTheme}
          >
            {themeIcon(theme)}
          </button>
          <button className="icon-btn" title="Sign out" onClick={onLogout}>
            ⎋
          </button>
        </div>
      </div>

      <div className="conv-list">
        {loading && conversations.length === 0 && (
          <div className="center-note">
            <div className="spinner" />
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="center-note">No conversations yet</div>
        )}
        {conversations.map((c) => {
          const last = c.lastMessage;
          const unread = c.unreadCount ?? 0;
          return (
            <button
              key={c.id}
              className={`conv-item ${c.id === activeId ? "active" : ""}`}
              onClick={() => onSelect(c.id)}
            >
              <Avatar url={conversationAvatar(c)} name={conversationTitle(c)} />
              <div className="conv-main">
                <div className="conv-top">
                  <span className="conv-name">{conversationTitle(c)}</span>
                  {last && (
                    <span className="conv-time">{shortTime(last.createdAt)}</span>
                  )}
                </div>
                <div className="conv-bottom">
                  <span className="conv-preview">{messagePreview(last)}</span>
                  {unread > 0 && (
                    <span className="unread-badge">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
