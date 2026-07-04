import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api/client";
import { onSessionExpired } from "./api/client";
import {
  loadSession,
  saveSession,
  clearSession,
  getRefreshToken,
  type Session,
} from "./api/tokens";
import type { Conversation, Message } from "./api/types";
import { realtime, type ConnectionState } from "./realtime/socket";
import { AuthScreen } from "./components/AuthScreen";
import { Sidebar } from "./components/Sidebar";
import { ChatPane } from "./components/ChatPane";
import {
  loadTheme,
  applyTheme,
  nextTheme,
  type Theme,
} from "./util/theme";
import { displayNameFor } from "./util/format";

const PAGE_SIZE = 50;

interface HistoryState {
  loading: boolean;
  hasMore: boolean;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [history, setHistory] = useState<Record<string, HistoryState>>({});
  const [typing, setTyping] = useState<Record<string, Set<string>>>({});
  const [conn, setConn] = useState<ConnectionState>("disconnected");

  // Refs for use inside long-lived socket handlers (avoid stale closures).
  const activeIdRef = useRef<string | null>(null);
  const meIdRef = useRef<string | null>(session?.user.id ?? null);
  const typingTimers = useRef<Record<string, number>>({});
  activeIdRef.current = activeId;
  meIdRef.current = session?.user.id ?? null;

  useEffect(() => applyTheme(theme), [theme]);

  // ---- Message cache helpers ----
  const appendMessage = useCallback((m: Message) => {
    setMessages((prev) => {
      const list = prev[m.conversationId] ?? [];
      if (list.some((x) => x.id === m.id)) {
        // Replace (e.g. status update) rather than duplicate.
        return {
          ...prev,
          [m.conversationId]: list.map((x) => (x.id === m.id ? m : x)),
        };
      }
      return { ...prev, [m.conversationId]: [...list, m] };
    });
  }, []);

  // Bump a conversation to the top and refresh its last message / unread count.
  const bumpConversation = useCallback((m: Message, fromMe: boolean) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === m.conversationId);
      if (idx === -1) return prev;
      const conv = prev[idx];
      const isActive = activeIdRef.current === m.conversationId;
      const unread =
        fromMe || isActive ? conv.unreadCount ?? 0 : (conv.unreadCount ?? 0) + 1;
      const updated: Conversation = {
        ...conv,
        lastMessage: m,
        unreadCount: unread,
      };
      const rest = prev.filter((_, i) => i !== idx);
      return [updated, ...rest];
    });
  }, []);

  // ---- Realtime lifecycle ----
  useEffect(() => {
    if (!session) return;
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
        // A peer read our messages: mark our sent messages as read.
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
    });
    return () => realtime.disconnect();
  }, [session, appendMessage, bumpConversation]);

  // ---- Load conversations on sign-in ----
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoadingConvs(true);
    api
      .conversations()
      .then((list) => {
        if (!cancelled) setConversations(list);
      })
      .catch(() => {
        /* handled by session-expiry listener / empty state */
      })
      .finally(() => {
        if (!cancelled) setLoadingConvs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  // ---- Auto sign-out when refresh fails ----
  useEffect(() => {
    const handler = () => doLogout(true);
    onSessionExpired.addEventListener("expired", handler);
    return () => onSessionExpired.removeEventListener("expired", handler);
  });

  // ---- Load initial history for the active conversation ----
  const loadInitial = useCallback(async (convId: string) => {
    setHistory((h) => ({ ...h, [convId]: { loading: true, hasMore: false } }));
    try {
      const page = await api.messages(convId, undefined, PAGE_SIZE);
      const chrono = [...page].reverse(); // server sends newest-first
      setMessages((prev) => ({ ...prev, [convId]: chrono }));
      setHistory((h) => ({
        ...h,
        [convId]: { loading: false, hasMore: page.length >= PAGE_SIZE },
      }));
    } catch {
      setHistory((h) => ({
        ...h,
        [convId]: { loading: false, hasMore: false },
      }));
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
      setHistory((h) => ({
        ...h,
        [convId]: { loading: false, hasMore: false },
      }));
    }
  }, [messages]);

  // ---- Selecting a conversation ----
  function selectConversation(id: string) {
    setActiveId(id);
    if (!messages[id]) loadInitial(id);
    realtime.markRead(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
  }

  // ---- Sending ----
  async function sendText(text: string) {
    const convId = activeIdRef.current;
    if (!convId) return;
    try {
      const msg = await api.sendMessage(convId, text);
      appendMessage(msg);
      bumpConversation(msg, true);
    } catch {
      /* keep the draft on failure; a toast layer is on the roadmap */
    }
  }

  function handleTypingChange(isTyping: boolean) {
    if (activeId) realtime.emitTyping(activeId, isTyping);
  }

  // ---- Auth ----
  function onAuthed(s: Session) {
    saveSession(s);
    setConversations([]);
    setMessages({});
    setHistory({});
    setActiveId(null);
    setSession(s);
  }

  function doLogout(expired = false) {
    const rt = getRefreshToken();
    if (!expired && rt) api.logout(rt).catch(() => {});
    realtime.disconnect();
    clearSession();
    setSession(null);
    setConversations([]);
    setMessages({});
    setActiveId(null);
  }

  if (!session) {
    return <AuthScreen onAuthed={onAuthed} />;
  }

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activeMessages = activeId ? messages[activeId] ?? [] : [];
  const activeHistory = activeId
    ? history[activeId] ?? { loading: false, hasMore: false }
    : { loading: false, hasMore: false };
  const typingNames =
    active && typing[active.id]
      ? [...typing[active.id]].map((uid) =>
          displayNameFor(uid, active, session.user),
        )
      : [];

  return (
    <div className="app">
      <Sidebar
        me={session.user}
        conversations={conversations}
        activeId={activeId}
        loading={loadingConvs}
        theme={theme}
        onSelect={selectConversation}
        onToggleTheme={() => setTheme((t) => nextTheme(t))}
        onLogout={() => doLogout(false)}
      />
      {active ? (
        <ChatPane
          key={active.id}
          me={session.user}
          conversation={active}
          messages={activeMessages}
          loadingHistory={activeHistory.loading}
          hasMore={activeHistory.hasMore}
          typingNames={typingNames}
          onLoadOlder={loadOlder}
          onSend={sendText}
          onTypingChange={handleTypingChange}
        />
      ) : (
        <div className="chat">
          <div className="chat-empty">
            {conn === "connected"
              ? "Select a conversation to start chatting"
              : "Connecting…"}
          </div>
        </div>
      )}
    </div>
  );
}
