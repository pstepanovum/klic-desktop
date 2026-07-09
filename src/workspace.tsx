import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, onSessionExpired } from "./api/client";
import { putFile } from "./util/upload";
import type { Session } from "./api/tokens";
import type { Conversation, Message, SelfUser } from "./api/types";
import { realtime, type ConnectionState } from "./realtime/socket";
import { Sidebar } from "./components/sidebar";
import { ChatPane } from "./components/chat-pane";
import { Settings } from "./components/settings/settings";
import { Friends } from "./components/friends";
import { RecentCalls } from "./components/recent-calls";
import { Icon } from "./icons/icon";
import { Avatar } from "./components/avatar";
import { useCall } from "./calls/call-provider";
import { CallView } from "./calls/call-view";
import { IncomingCall } from "./calls/incoming-call";
import { conversationTitle } from "./util/format";
import { displayNameFor } from "./util/format";
import { type Theme } from "./util/theme";

const PAGE_SIZE = 50;
type Tab = "chats" | "friends" | "calls" | "settings";

interface HistoryState {
  loading: boolean;
  hasMore: boolean;
}

interface Props {
  session: Session;
  self: SelfUser;
  theme: Theme;
  search: string;
  onSetTheme: (t: Theme) => void;
  onUpdateSelf: (u: SelfUser) => void;
  onLogout: () => void;
}

export function Workspace({
  session,
  self,
  theme,
  search,
  onSetTheme,
  onUpdateSelf,
  onLogout,
}: Props) {
  const call = useCall();
  const [tab, setTab] = useState<Tab>("chats");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [history, setHistory] = useState<Record<string, HistoryState>>({});
  const [typing, setTyping] = useState<Record<string, Set<string>>>({});
  const [conn, setConn] = useState<ConnectionState>("disconnected");
  const [toast, setToast] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const activeIdRef = useRef<string | null>(null);
  const meIdRef = useRef<string>(self.id);
  const typingTimers = useRef<Record<string, number>>({});
  const signalsRef = useRef(call.signals);
  activeIdRef.current = activeId;
  meIdRef.current = self.id;
  signalsRef.current = call.signals;

  const appendMessage = useCallback((m: Message) => {
    setMessages((prev) => {
      const list = prev[m.conversationId] ?? [];
      if (list.some((x) => x.id === m.id)) {
        return {
          ...prev,
          [m.conversationId]: list.map((x) => (x.id === m.id ? m : x)),
        };
      }
      return { ...prev, [m.conversationId]: [...list, m] };
    });
  }, []);

  const bumpConversation = useCallback((m: Message, fromMe: boolean) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === m.conversationId);
      if (idx === -1) return prev;
      const conv = prev[idx];
      const isActive = activeIdRef.current === m.conversationId;
      const unread =
        fromMe || isActive ? conv.unreadCount ?? 0 : (conv.unreadCount ?? 0) + 1;
      const updated: Conversation = { ...conv, lastMessage: m, unreadCount: unread };
      const rest = prev.filter((_, i) => i !== idx);
      return [updated, ...rest];
    });
  }, []);

  // ---- Realtime (chat + call signals) ----
  useEffect(() => {
    realtime.connect(session.accessToken, {
      onState: setConn,
      onMessage: (m) => {
        const fromMe = m.senderId === meIdRef.current;
        appendMessage(m);
        bumpConversation(m, fromMe);
        if (!fromMe && activeIdRef.current === m.conversationId) {
          realtime.markRead(m.conversationId);
        }
      },
      onRead: (e) => {
        if (e.userId === meIdRef.current) return;
        setMessages((prev) => {
          const list = prev[e.conversationId];
          if (!list) return prev;
          return {
            ...prev,
            [e.conversationId]: list.map((x) =>
              x.senderId === meIdRef.current && x.status !== "read"
                ? { ...x, status: "read" }
                : x,
            ),
          };
        });
      },
      onTyping: (e) => {
        if (e.userId === meIdRef.current) return;
        const key = `${e.conversationId}:${e.userId}`;
        setTyping((prev) => {
          const set = new Set(prev[e.conversationId] ?? []);
          if (e.isTyping) set.add(e.userId);
          else set.delete(e.userId);
          return { ...prev, [e.conversationId]: set };
        });
        window.clearTimeout(typingTimers.current[key]);
        if (e.isTyping) {
          typingTimers.current[key] = window.setTimeout(() => {
            setTyping((prev) => {
              const set = new Set(prev[e.conversationId] ?? []);
              set.delete(e.userId);
              return { ...prev, [e.conversationId]: set };
            });
          }, 5000);
        }
      },
      onReaction: (e) => {
        setMessages((prev) => {
          for (const [cid, list] of Object.entries(prev)) {
            if (list.some((m) => m.id === e.messageId)) {
              return {
                ...prev,
                [cid]: list.map((m) =>
                  m.id === e.messageId ? { ...m, reactions: e.reactions } : m,
                ),
              };
            }
          }
          return prev;
        });
      },
      // Call signals delegate to the CallProvider (via a ref for freshness).
      onCallInvite: (e) => signalsRef.current.onInvite(e),
      onCallAccept: (e) => signalsRef.current.onAccept(e),
      onCallDecline: (e) => signalsRef.current.onDecline(e),
      onCallCancel: (e) => signalsRef.current.onCancel(e),
      onCallEnd: (e) => signalsRef.current.onEnd(e),
      onCallParticipantJoined: (e) => signalsRef.current.onParticipantJoined(e),
      onCallParticipantLeft: (e) => signalsRef.current.onParticipantLeft(e),
    });
    return () => realtime.disconnect();
  }, [session.accessToken, appendMessage, bumpConversation]);

  // ---- Load conversations ----
  useEffect(() => {
    let cancelled = false;
    setLoadingConvs(true);
    api
      .conversations()
      .then((list) => !cancelled && setConversations(list))
      .catch(() => {})
      .finally(() => !cancelled && setLoadingConvs(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handler = () => onLogout();
    onSessionExpired.addEventListener("expired", handler);
    return () => onSessionExpired.removeEventListener("expired", handler);
  }, [onLogout]);

  const loadInitial = useCallback(async (convId: string) => {
    setHistory((h) => ({ ...h, [convId]: { loading: true, hasMore: false } }));
    try {
      const page = await api.messages(convId, undefined, PAGE_SIZE);
      const chrono = [...page].reverse();
      setMessages((prev) => ({ ...prev, [convId]: chrono }));
      setHistory((h) => ({
        ...h,
        [convId]: { loading: false, hasMore: page.length >= PAGE_SIZE },
      }));
    } catch {
      setHistory((h) => ({ ...h, [convId]: { loading: false, hasMore: false } }));
    }
  }, []);

  const loadOlder = useCallback(async () => {
    const convId = activeIdRef.current;
    if (!convId) return;
    const list = messages[convId] ?? [];
    const oldest = list[0];
    if (!oldest) return;
    setHistory((h) => ({
      ...h,
      [convId]: { loading: true, hasMore: h[convId]?.hasMore ?? false },
    }));
    try {
      const page = await api.messages(convId, oldest.createdAt, PAGE_SIZE);
      const chrono = [...page].reverse();
      setMessages((prev) => ({
        ...prev,
        [convId]: [...chrono, ...(prev[convId] ?? [])],
      }));
      setHistory((h) => ({
        ...h,
        [convId]: { loading: false, hasMore: page.length >= PAGE_SIZE },
      }));
    } catch {
      setHistory((h) => ({ ...h, [convId]: { loading: false, hasMore: false } }));
    }
  }, [messages]);

  function selectConversation(id: string) {
    setActiveId(id);
    setTab("chats");
    if (!messages[id]) loadInitial(id);
    realtime.markRead(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
  }

  async function sendText(text: string, replyToId?: string) {
    const convId = activeIdRef.current;
    if (!convId) return;
    try {
      const msg = await api.sendMessage(convId, text, replyToId);
      appendMessage(msg);
      bumpConversation(msg, true);
    } catch {
      /* keep draft on failure */
    }
  }

  function reactMessage(messageId: string, emoji: string) {
    const convId = activeIdRef.current;
    if (convId) api.react(convId, messageId, emoji).catch(() => {});
  }

  function starMessage(messageId: string) {
    api.starMessage(messageId).catch(() => {});
  }

  function pinMessage(messageId: string) {
    const convId = activeIdRef.current;
    if (convId) api.pinMessage(convId, messageId).catch(() => {});
  }

  function deleteMessage(messageId: string) {
    const convId = activeIdRef.current;
    if (!convId) return;
    api.deleteMessage(convId, messageId).catch(() => {});
    // Optimistically mark deleted.
    setMessages((prev) => {
      const list = prev[convId];
      if (!list) return prev;
      return {
        ...prev,
        [convId]: list.map((m) =>
          m.id === messageId
            ? { ...m, deletedAt: new Date().toISOString(), body: "" }
            : m,
        ),
      };
    });
  }

  async function sendSticker(stickerId: string) {
    const convId = activeIdRef.current;
    if (!convId) return;
    try {
      const msg = await api.sendSticker(convId, stickerId);
      appendMessage(msg);
      bumpConversation(msg, true);
    } catch {
      /* ignore */
    }
  }

  function attachmentKind(contentType: string): string {
    return contentType.startsWith("image/")
      ? "IMAGE"
      : contentType.startsWith("video/")
        ? "VIDEO"
        : contentType.startsWith("audio/")
          ? "VOICE"
          : "FILE";
  }

  // Uploads a single file to storage and returns its attachment descriptor.
  async function uploadOne(convId: string, file: File) {
    const ct = file.type || "application/octet-stream";
    const kind = attachmentKind(ct);
    const { key, uploadUrl } = await api.uploadUrl(convId, kind, ct, file.size);
    await putFile(uploadUrl, ct, file);
    return {
      key,
      kind,
      contentType: ct,
      byteSize: file.size,
      fileName: file.name,
    };
  }

  // Attach button path: send a single file.
  async function sendFile(file: File) {
    await sendFiles([file]);
  }

  // Bulk path (attach picker + drag-and-drop): upload every file, then group
  // all images into one bento-style message (matching mobile) and send each
  // non-image file as its own message.
  async function sendFiles(files: File[]) {
    const convId = activeIdRef.current;
    if (!convId || files.length === 0) return;
    setToast(files.length > 1 ? `Uploading ${files.length} files…` : "Uploading…");
    try {
      const uploaded = await Promise.all(
        files.map((f) => uploadOne(convId, f)),
      );
      const images = uploaded.filter((a) => a.kind === "IMAGE");
      const others = uploaded.filter((a) => a.kind !== "IMAGE");
      const batches = [
        ...(images.length ? [images] : []),
        ...others.map((o) => [o]),
      ];
      for (const batch of batches) {
        const msg = await api.sendAttachment(convId, batch);
        appendMessage(msg);
        bumpConversation(msg, true);
      }
      setToast(null);
    } catch (e) {
      setToast(
        e instanceof ApiError
          ? e.message
          : "Couldn't upload — media storage may be unavailable.",
      );
      window.setTimeout(() => setToast(null), 4000);
    }
  }

  function handleTypingChange(isTyping: boolean) {
    if (activeId) realtime.emitTyping(activeId, isTyping);
  }

  const q = search.trim().toLowerCase();
  const visibleConversations = q
    ? conversations.filter((c) =>
        conversationTitle(c).toLowerCase().includes(q),
      )
    : conversations;
  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activeMessages = activeId ? messages[activeId] ?? [] : [];
  const activeHistory = activeId
    ? history[activeId] ?? { loading: false, hasMore: false }
    : { loading: false, hasMore: false };
  const typingNames =
    active && typing[active.id]
      ? [...typing[active.id]].map((uid) => displayNameFor(uid, active, self))
      : [];

  function startCall(kind: "AUDIO" | "VIDEO") {
    if (!active) return;
    call.startCall(
      active.id,
      kind,
      conversationTitle(active),
      active.type === "GROUP",
    );
  }

  const showCall = call.phase === "active" || call.phase === "outgoing";

  return (
    <div className="app">
      <nav className="nav-rail">
        <button
          className={`nav-btn ${tab === "chats" ? "active" : ""}`}
          onClick={() => setTab("chats")}
          title="Chats"
        >
          <Icon name={tab === "chats" ? "tab_chat_solid" : "tab_chat"} size={24} />
        </button>
        <button
          className={`nav-btn ${tab === "friends" ? "active" : ""}`}
          onClick={() => setTab("friends")}
          title="Friends"
        >
          <Icon name={tab === "friends" ? "tab_user_solid" : "tab_user"} size={24} />
        </button>
        <button
          className={`nav-btn ${tab === "calls" ? "active" : ""}`}
          onClick={() => setTab("calls")}
          title="Calls"
        >
          <Icon name={tab === "calls" ? "tab_call_solid" : "tab_call"} size={24} />
        </button>
        <button
          className={`nav-btn ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
          title="Settings"
        >
          <Icon
            name={tab === "settings" ? "tab_settings_solid" : "tab_settings"}
            size={24}
          />
        </button>
        <div className="nav-spacer" />
        <button
          className="nav-btn nav-avatar"
          onClick={() => setTab("settings")}
          title={self.displayName}
        >
          <Avatar url={self.avatarUrl} name={self.displayName} size="sm" />
        </button>
      </nav>

      {tab === "chats" && (
        <>
          <Sidebar
            conversations={visibleConversations}
            activeId={activeId}
            loading={loadingConvs}
            onSelect={selectConversation}
          />
          {active ? (
            <div
              className="chat-dropzone"
              onDragOver={(e) => {
                // Only react to file drags, never text/element drags.
                if (!e.dataTransfer.types.includes("Files")) return;
                e.preventDefault();
                if (!dragging) setDragging(true);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setDragging(false);
              }}
              onDrop={(e) => {
                if (!e.dataTransfer.types.includes("Files")) return;
                e.preventDefault();
                setDragging(false);
                const files = Array.from(e.dataTransfer.files ?? []);
                if (files.length) sendFiles(files);
              }}
            >
              <ChatPane
                key={active.id}
                me={self}
                conversation={active}
                messages={activeMessages}
                loadingHistory={activeHistory.loading}
                hasMore={activeHistory.hasMore}
                typingNames={typingNames}
                onLoadOlder={loadOlder}
                onSend={sendText}
                onTypingChange={handleTypingChange}
                onStartCall={startCall}
                onSendSticker={sendSticker}
                onSendFile={sendFile}
                onReact={reactMessage}
                onStar={starMessage}
                onPin={pinMessage}
                onDelete={deleteMessage}
              />
              {dragging && (
                <div className="drop-overlay">Drop to send</div>
              )}
            </div>
          ) : (
            <div className="chat">
              <div className="chat-empty">
                {conn === "connected"
                  ? "Select a conversation to start chatting"
                  : "Connecting…"}
              </div>
            </div>
          )}
        </>
      )}
      {tab === "friends" && <Friends conversations={conversations} />}
      {tab === "calls" && (
        <RecentCalls
          onCallBack={(convId, kind, title) =>
            call.startCall(convId, kind, title, false)
          }
        />
      )}
      {tab === "settings" && (
        <Settings
          self={self}
          theme={theme}
          onSetTheme={onSetTheme}
          onUpdated={onUpdateSelf}
          onLogout={onLogout}
        />
      )}

      {call.phase === "incoming" && <IncomingCall />}
      {showCall && <CallView />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
