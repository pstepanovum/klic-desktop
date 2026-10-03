import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Attachment, Conversation, Message, SelfUser } from "../api/types";
import { Avatar } from "./avatar";
import {
  clockTime,
  conversationTitle,
  conversationAvatar,
  displayNameFor,
  humanSize,
} from "../util/format";
import { Icon, type IconName } from "../icons/icon";
import { externalLinkClick } from "../util/external";
import { splitTrail } from "../util/link-text";

// Popovers that only matter once opened load on demand.
const StickerPicker = lazy(() =>
  import("./sticker-picker").then((m) => ({ default: m.StickerPicker })),
);
const ImageViewer = lazy(() =>
  import("./image-viewer").then((m) => ({ default: m.ImageViewer })),
);

interface Props {
  me: SelfUser;
  conversation: Conversation;
  messages: Message[];
  loadingHistory: boolean;
  hasMore: boolean;
  typingNames: string[];
  onLoadOlder: () => void;
  onSend: (text: string, replyToId?: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  onStartCall?: (kind: "AUDIO" | "VIDEO") => void;
  onSendSticker?: (stickerId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onStar?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onSendFile?: (file: File) => void;
}

const QUICK_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function callDur(ms?: number): string {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function callEventText(m: Message): string {
  const c = m.call;
  const type = c?.kind === "VIDEO" ? "video" : "voice";
  if (!c) return "Call";
  if (c.outcome === "missed") return `Missed ${type} call`;
  if (c.outcome === "declined") return `Declined ${type} call`;
  if (c.outcome === "canceled") return `Cancelled ${type} call`;
  if (c.outcome === "failed") return `${type === "video" ? "Video" : "Voice"} call failed`;
  const dur = c.durationMs ? ` · ${callDur(c.durationMs)}` : "";
  return `${type === "video" ? "Video" : "Voice"} call${dur}`;
}

// Detect a rich-embeddable link (Spotify / YouTube) in message text.
function detectEmbed(
  text: string,
): { kind: "spotify" | "youtube"; src: string } | null {
  const sp = text.match(
    /open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/,
  );
  if (sp)
    return { kind: "spotify", src: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}` };
  const yt = text.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (yt) return { kind: "youtube", src: `https://www.youtube.com/embed/${yt[1]}` };
  return null;
}

function LinkEmbed({ embed }: { embed: { kind: string; src: string } }) {
  return (
    <iframe
      className={embed.kind === "spotify" ? "embed-spotify" : "embed-youtube"}
      src={embed.src}
      loading="lazy"
      allow="encrypted-media; clipboard-write; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      // YouTube's player refuses to play without a referrer, so keep the origin.
      referrerPolicy="strict-origin-when-cross-origin"
      title="embedded media"
    />
  );
}

// Render message text with clickable links (opened in the system browser).
function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.flatMap((p, i) => {
    if (!/^https?:\/\//.test(p)) return [<span key={i}>{p}</span>];
    const [url, trail] = splitTrail(p);
    return [
      <a
        key={i}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="msg-link"
        onClick={(e) => externalLinkClick(e, url)}
      >
        {url}
      </a>,
      trail && <span key={`${i}t`}>{trail}</span>,
    ];
  });
}

function Tick({ status }: { status?: Message["status"] }) {
  if (!status) return null;
  const doubled = status === "read" || status === "delivered";
  return (
    <span className={`tick ${status === "read" ? "read" : ""}`}>
      <Icon name={doubled ? "check_double" : "check"} size={12} />
    </span>
  );
}

function AttachmentView({
  att,
  onOpen,
}: {
  att: Attachment;
  onOpen: (url: string) => void;
}) {
  if (att.kind === "IMAGE") {
    return (
      <img
        className="bubble-img"
        src={att.url}
        alt={att.fileName ?? "image"}
        loading="lazy"
        onClick={() => att.url && onOpen(att.url)}
      />
    );
  }
  const ct = att.contentType ?? "";
  const name = (att.fileName ?? "").toLowerCase();
  if (att.kind === "VIDEO" || att.kind === "VIDEO_NOTE" || ct.startsWith("video")) {
    return <video className="bubble-img" src={att.url} controls preload="metadata" />;
  }
  if (att.kind === "VOICE" || ct.startsWith("audio") || name.endsWith(".mp3")) {
    return (
      <div className="file-audio">
        <span className="file-ic">
          <Icon name="bold_volume_high" size={20} />
        </span>
        <div className="file-audio-body">
          {att.fileName && <div className="file-name">{att.fileName}</div>}
          <audio src={att.url} controls preload="metadata" />
        </div>
      </div>
    );
  }

  const isPdf = ct.includes("pdf") || name.endsWith(".pdf");
  const icon: IconName = isPdf
    ? "bold_document"
    : ct.includes("zip") || ct.includes("compressed")
      ? "bold_folder"
      : "bold_document";
  const label = isPdf
    ? "PDF document"
    : ct.split("/")[1]?.toUpperCase() || "File";

  return (
    <div className="file-attach">
      {isPdf && (
        <embed
          className="file-pdf"
          src={`${att.url}#toolbar=0&navpanes=0`}
          type="application/pdf"
        />
      )}
      <a
        className="bubble-file"
        href={att.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => externalLinkClick(e, att.url)}
      >
        <span className="file-ic">
          <Icon name={icon} size={22} />
        </span>
        <span className="file-meta">
          <span className="file-name">{att.fileName ?? "File"}</span>
          <span className="file-sub">
            {label}
            {att.byteSize ? ` · ${humanSize(att.byteSize)}` : ""}
          </span>
        </span>
        <span className="file-dl">
          <Icon name="download" size={18} />
        </span>
      </a>
    </div>
  );
}

interface BubbleProps {
  m: Message;
  mine: boolean;
  grouped: boolean;
  // Sender label for group chats; only set on the first bubble of a run.
  senderName?: string;
  onContextMenu: (e: React.MouseEvent, m: Message) => void;
  onReaction: (m: Message, emoji: string) => void;
  onOpenImage: (url: string) => void;
}

// One message row. Memoized with stable handlers and precomputed layout flags so
// a new message or a typing update doesn't re-render the whole history.
const MessageBubble = memo(function MessageBubble({
  m,
  mine,
  grouped,
  senderName,
  onContextMenu,
  onReaction,
  onOpenImage,
}: BubbleProps) {
  const deleted = !!m.deletedAt;
  const text = useMemo(() => (m.body ? linkify(m.body) : null), [m.body]);
  const embed = useMemo(() => (m.body ? detectEmbed(m.body) : null), [m.body]);

  if (m.kind === "CALL_EVENT") {
    return (
      <div className="call-event">
        <Icon
          name={m.call?.kind === "VIDEO" ? "bold_video" : "bold_phone"}
          size={13}
        />
        <span>{callEventText(m)}</span>
        <span className="call-event-time">{clockTime(m.createdAt)}</span>
      </div>
    );
  }

  const isSticker = m.kind === "STICKER" || (!!m.stickerUrl && !m.body);
  return (
    <div className={`msg-row ${mine ? "out" : "in"} ${grouped ? "grouped" : ""}`}>
      <div
        className={`bubble ${isSticker ? "sticker-only" : ""}`}
        onContextMenu={(e) => onContextMenu(e, m)}
      >
        {senderName !== undefined && (
          <div className="bubble-sender">{senderName}</div>
        )}
        {m.replyTo && (
          <div className="bubble-reply">
            {m.replyTo.deleted ? "Deleted message" : m.replyTo.preview}
          </div>
        )}
        {m.attachments.map((att) => (
          <AttachmentView key={att.id} att={att} onOpen={onOpenImage} />
        ))}
        {m.stickerUrl && (
          <img
            className={isSticker ? "bubble-sticker" : "bubble-img"}
            src={m.stickerUrl}
            alt="sticker"
          />
        )}
        {deleted ? (
          <div className="bubble-text" style={{ fontStyle: "italic", opacity: 0.7 }}>
            Message deleted
          </div>
        ) : (
          m.body && <div className="bubble-text">{text}</div>
        )}
        {!deleted && m.body && embed && <LinkEmbed embed={embed} />}
        {m.reactions && m.reactions.length > 0 && (
          <div className="bubble-reactions">
            {m.reactions.map((r) => (
              <button
                key={r.emoji}
                className={`reaction ${r.mine ? "mine" : ""}`}
                onClick={() => onReaction(m, r.emoji)}
              >
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        )}
        <div className="bubble-meta">
          <span>{clockTime(m.createdAt)}</span>
          {mine && <Tick status={m.status} />}
        </div>
      </div>
    </div>
  );
});

interface ComposerProps {
  onSend: (text: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  onSendSticker?: (stickerId: string) => void;
  onSendFile?: (file: File) => void;
}

// Owns the draft and the typing-indicator emitter so keystrokes only re-render
// the composer, not the message list. The pane remounts per conversation
// (key={conversation.id}), which also resets the draft.
function Composer({
  onSend,
  onTypingChange,
  onSendSticker,
  onSendFile,
}: ComposerProps) {
  const [draft, setDraft] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<number | null>(null);
  const wasTyping = useRef(false);

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

  return (
    <div className="composer">
      {onSendFile && (
        <>
          <button
            className="icon-btn composer-btn"
            title="Attach a photo or file"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="paperclip" size={21} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,audio/*,*/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onSendFile(f);
              e.target.value = "";
            }}
          />
        </>
      )}
      <div className="composer-input">
        <textarea
          value={draft}
          placeholder="Write a message…"
          rows={1}
          onChange={(e) => handleDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={stopTyping}
        />
        {onSendSticker && (
          <>
            <button
              className="composer-emoji"
              title="Stickers"
              onClick={() => setShowStickers((v) => !v)}
            >
              <Icon name="smile" size={22} />
            </button>
            {showStickers && (
              <Suspense fallback={null}>
                <StickerPicker
                  onPick={(id) => onSendSticker(id)}
                  onClose={() => setShowStickers(false)}
                />
              </Suspense>
            )}
          </>
        )}
      </div>
      <button
        className="send-btn"
        onClick={send}
        disabled={draft.trim().length === 0}
        title="Send (Enter)"
      >
        <Icon name="paperplane" size={20} />
      </button>
    </div>
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
  onReact,
  onStar,
  onPin,
  onDelete,
  onSendFile,
}: Props) {
  const [menu, setMenu] = useState<{ x: number; y: number; m: Message } | null>(
    null,
  );
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLastId = useRef<string | null>(null);
  const prevConvId = useRef<string | null>(null);
  // Latest onReact for the stable bubble handler below (the parent passes a
  // fresh function every render).
  const onReactRef = useRef(onReact);
  onReactRef.current = onReact;

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

  const openMenu = useCallback((e: React.MouseEvent, m: Message) => {
    if (m.deletedAt) return;
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, m });
  }, []);

  const reactTo = useCallback((m: Message, emoji: string) => {
    onReactRef.current?.(m.id, emoji);
  }, []);

  function sendDraft(text: string) {
    onSend(text, replyTo?.id);
    setReplyTo(null);
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
          const grouped = !!prev && prev.senderId === m.senderId;
          const showSender = isGroup && !mine && !grouped;
          return (
            <MessageBubble
              key={m.id}
              m={m}
              mine={mine}
              grouped={grouped}
              senderName={
                showSender
                  ? displayNameFor(m.senderId, conversation, me)
                  : undefined
              }
              onContextMenu={openMenu}
              onReaction={reactTo}
              onOpenImage={setViewer}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {viewer && (
        <Suspense fallback={null}>
          <ImageViewer src={viewer} onClose={() => setViewer(null)} />
        </Suspense>
      )}

      {menu && (
        <>
          <div className="ctx-backdrop" onClick={() => setMenu(null)} />
          <div
            className="ctx-menu"
            style={{
              left: Math.min(menu.x, window.innerWidth - 220),
              top: Math.min(menu.y, window.innerHeight - 200),
            }}
          >
            {onReact && (
              <div className="ctx-emoji">
                {QUICK_EMOJI.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      onReact(menu.m.id, e);
                      setMenu(null);
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
            <button
              className="ctx-item"
              onClick={() => {
                setReplyTo(menu.m);
                setMenu(null);
              }}
            >
              Reply
            </button>
            <button
              className="ctx-item"
              onClick={() => {
                navigator.clipboard?.writeText(menu.m.body).catch(() => {});
                setMenu(null);
              }}
            >
              Copy
            </button>
            {onStar && (
              <button
                className="ctx-item"
                onClick={() => {
                  onStar(menu.m.id);
                  setMenu(null);
                }}
              >
                Star
              </button>
            )}
            {onPin && (
              <button
                className="ctx-item"
                onClick={() => {
                  onPin(menu.m.id);
                  setMenu(null);
                }}
              >
                Pin
              </button>
            )}
            {onDelete && menu.m.senderId === me.id && (
              <button
                className="ctx-item danger"
                onClick={() => {
                  onDelete(menu.m.id);
                  setMenu(null);
                }}
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}

      {replyTo && (
        <div className="reply-banner">
          <div className="reply-banner-body">
            <div className="reply-banner-title">
              Replying to {displayNameFor(replyTo.senderId, conversation, me)}
            </div>
            <div className="reply-banner-text">{replyTo.body || "Attachment"}</div>
          </div>
          <button className="icon-btn" onClick={() => setReplyTo(null)}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <Composer
        onSend={sendDraft}
        onTypingChange={onTypingChange}
        onSendSticker={onSendSticker}
        onSendFile={onSendFile}
      />
    </section>
  );
}
