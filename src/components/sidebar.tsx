import type { Conversation } from "../api/types";
import { Avatar } from "./avatar";
import {
  conversationTitle,
  conversationAvatar,
  messagePreview,
  shortTime,
} from "../util/format";
interface Props {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}

export function Sidebar({ conversations, activeId, loading, onSelect }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Chats</span>
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
