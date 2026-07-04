import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Attachment, Conversation, Message, SelfUser } from "../api/types";
import { Avatar } from "./Avatar";
import {
  clockTime,
  conversationTitle,
  conversationAvatar,
  displayNameFor,
  humanSize,
} from "../util/format";
import { Icon } from "../icons/Icon";
import { StickerPicker } from "./StickerPicker";

interface Props {
  me: SelfUser;
  conversation: Conversation;
  messages: Message[];
  loadingHistory: boolean;
  hasMore: boolean;
  typingNames: string[];
  onLoadOlder: () => void;
  onSend: (text: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  onStartCall?: (kind: "AUDIO" | "VIDEO") => void;
  onSendSticker?: (stickerId: string) => void;
}

function Tick({ status }: { status?: Message["status"] }) {
  if (!status) return null;
  if (status === "read") return <span className="tick read">✓✓</span>;
  if (status === "delivered") return <span className="tick">✓✓</span>;
  return <span className="tick">✓</span>;
}

function AttachmentView({ att }: { att: Attachment }) {
  if (att.kind === "IMAGE") {
    return (
      <img
        className="bubble-img"
        src={att.url}
        alt={att.fileName ?? "image"}
        loading="lazy"
        onClick={() => att.url && window.open(att.url, "_blank")}
      />
    );
  }
  return (
    <a className="bubble-file" href={att.url} target="_blank" rel="noreferrer">
      <span>📎</span>
      <span>
        {att.fileName ?? att.kind.toLowerCase()}
        {att.byteSize ? ` · ${humanSize(att.byteSize)}` : ""}
      </span>
    </a>
  );
}

export function ChatPane({
  me,
  conversation,
  messages,
  loadingHistory,
  hasMore,
  typingNames,
  onLoadOlder,
  onSend,
  onTypingChange,
  onStartCall,
  onSendSticker,
}: Props) {
  const [draft, setDraft] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);
  const wasTyping = useRef(false);
  const prevLastId = useRef<string | null>(null);
  const prevConvId = useRef<string | null>(null);

  const isGroup = conversation.type === "GROUP";

  // Auto-scroll to bottom on conversation switch and when a new message arrives
  // at the end (but not when older history is prepended).
  useLayoutEffect(() => {
    const last = messages[messages.length - 1];
    const convChanged = prevConvId.current !== conversation.id;
    const newTail = last && prevLastId.current !== last.id;
    if (convChanged || newTail) {
      bottomRef.current?.scrollIntoView({
        behavior: convChanged ? "auto" : "smooth",
      });
    }
    prevConvId.current = conversation.id;
    prevLastId.current = last ? last.id : null;
  }, [messages, conversation.id]);

  // Reset draft when switching conversations.
  useEffect(() => {
    setDraft("");
  }, [conversation.id]);

  function stopTyping() {
    if (wasTyping.current) {
      wasTyping.current = false;
      onTypingChange(false);
    }
    if (typingTimer.current) {
      window.clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
  }

  function handleDraft(value: string) {
    setDraft(value);
    if (value.length > 0) {
      if (!wasTyping.current) {
        wasTyping.current = true;
        onTypingChange(true);
      }
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(stopTyping, 3000);
    } else {
      stopTyping();
    }
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
    stopTyping();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const subtitle =
    typingNames.length > 0
      ? typingNames.length === 1
        ? `${typingNames[0]} is typing…`
        : "typing…"
      : isGroup
        ? `${conversation.members.length + 1} members`
        : `@${conversation.members[0]?.username ?? ""}`;

  return (
    <section className="chat">
      <header className="chat-header">
        <Avatar
          url={conversationAvatar(conversation)}
          name={conversationTitle(conversation)}
          size="sm"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="chat-header-title">
            {conversationTitle(conversation)}
          </div>
          <div className="chat-header-sub">{subtitle}</div>
        </div>
        {onStartCall && (
          <div style={{ display: "flex", gap: 2 }}>
            <button
              className="icon-btn"
              title="Voice call"
              onClick={() => onStartCall("AUDIO")}
            >
              <Icon name="call_solid" size={19} />
            </button>
            <button
              className="icon-btn"
              title="Video call"
              onClick={() => onStartCall("VIDEO")}
            >
              <Icon name="video_solid" size={19} />
            </button>
          </div>
        )}
      </header>

      <div className="messages" ref={scrollRef}>
        {hasMore && (
          <button
            className="load-more"
            onClick={onLoadOlder}
            disabled={loadingHistory}
          >
            {loadingHistory ? "Loading…" : "Load earlier messages"}
          </button>
        )}
        {loadingHistory && messages.length === 0 && (
          <div className="center-note">
            <div className="spinner" />
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.senderId === me.id;
          const prev = messages[i - 1];
          const grouped = prev && prev.senderId === m.senderId;
          const showSender = isGroup && !mine && !grouped;
          const deleted = !!m.deletedAt;
          return (
            <div
              key={m.id}
              className={`msg-row ${mine ? "out" : "in"} ${grouped ? "grouped" : ""}`}
            >
              <div className="bubble">
                {showSender && (
                  <div className="bubble-sender">
                    {displayNameFor(m.senderId, conversation, me)}
                  </div>
                )}
                {m.attachments.map((att) => (
                  <AttachmentView key={att.id} att={att} />
                ))}
                {m.stickerUrl && (
                  <img className="bubble-img" src={m.stickerUrl} alt="sticker" />
                )}
                {deleted ? (
                  <div className="bubble-text" style={{ fontStyle: "italic", opacity: 0.7 }}>
                    Message deleted
                  </div>
                ) : (
                  m.body && <div className="bubble-text">{m.body}</div>
                )}
                <div className="bubble-meta">
                  <span>{clockTime(m.createdAt)}</span>
                  {mine && <Tick status={m.status} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="composer">
        {onSendSticker && (
          <div style={{ position: "relative" }}>
            <button
              className="icon-btn composer-btn"
              title="Stickers"
              onClick={() => setShowStickers((v) => !v)}
            >
              <Icon name="media" size={22} />
            </button>
            {showStickers && (
              <StickerPicker
                onPick={(id) => onSendSticker(id)}
                onClose={() => setShowStickers(false)}
              />
            )}
          </div>
        )}
        <textarea
          value={draft}
          placeholder="Write a message…"
          rows={1}
          onChange={(e) => handleDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={stopTyping}
        />
        <button
          className="send-btn"
          onClick={send}
          disabled={draft.trim().length === 0}
          title="Send (Enter)"
        >
          ➤
        </button>
      </div>
    </section>
  );
}
