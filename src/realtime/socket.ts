// Socket.IO realtime connection. Connects to the API origin (not /api/v1) with
// the access token in the handshake, and exposes typed subscribe helpers.
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";
import type {
  Message,
  TypingEvent,
  ReadEvent,
  PresenceEvent,
  CallInvite,
  CallSignal,
} from "../api/types";

export type ConnectionState = "connecting" | "connected" | "disconnected";

export interface RealtimeHandlers {
  onMessage?: (m: Message) => void;
  onTyping?: (e: TypingEvent) => void;
  onRead?: (e: ReadEvent) => void;
  onPresence?: (e: PresenceEvent) => void;
  onReaction?: (e: {
    messageId: string;
    conversationId?: string;
    reactions: Message["reactions"];
  }) => void;
  onState?: (s: ConnectionState) => void;
  // Calls (server -> client). All call actions are REST; these are signals.
  onCallInvite?: (e: CallInvite) => void;
  onCallAccept?: (e: CallSignal) => void;
  onCallDecline?: (e: CallSignal) => void;
  onCallCancel?: (e: CallSignal) => void;
  onCallEnd?: (e: CallSignal) => void;
  onCallParticipantJoined?: (e: CallSignal) => void;
  onCallParticipantLeft?: (e: CallSignal) => void;
}

export class Realtime {
  private socket: Socket | null = null;
  private handlers: RealtimeHandlers = {};
  // Window-visibility state → server presence. Online = a foregrounded (visible) client.
  private active = true;

  connect(token: string, handlers: RealtimeHandlers): void {
    this.handlers = handlers;
    this.disconnect();

    this.handlers.onState?.("connecting");
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      this.handlers.onState?.("connected");
      // Report our current window-visibility state on every (re)connect.
      socket.emit("presence:active", { active: this.active });
    });
    socket.on("disconnect", () => this.handlers.onState?.("disconnected"));
    socket.on("connect_error", () => this.handlers.onState?.("disconnected"));

    socket.on("message:new", (m: Message) => this.handlers.onMessage?.(m));
    socket.on("typing", (e: TypingEvent) => this.handlers.onTyping?.(e));
    socket.on("message:read", (e: ReadEvent) => this.handlers.onRead?.(e));
    socket.on("presence:update", (e: PresenceEvent) =>
      this.handlers.onPresence?.(e),
    );

    socket.on("message:reaction", (e) => this.handlers.onReaction?.(e));

    socket.on("call:invite", (e: CallInvite) => this.handlers.onCallInvite?.(e));
    socket.on("call:accept", (e: CallSignal) => this.handlers.onCallAccept?.(e));
    socket.on("call:decline", (e: CallSignal) =>
      this.handlers.onCallDecline?.(e),
    );
    socket.on("call:cancel", (e: CallSignal) => this.handlers.onCallCancel?.(e));
    socket.on("call:end", (e: CallSignal) => this.handlers.onCallEnd?.(e));
    socket.on("call:participant-joined", (e: CallSignal) =>
      this.handlers.onCallParticipantJoined?.(e),
    );
    socket.on("call:participant-left", (e: CallSignal) =>
      this.handlers.onCallParticipantLeft?.(e),
    );

    this.socket = socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Client -> server events (the server accepts exactly these three).
  emitTyping(conversationId: string, isTyping: boolean): void {
    this.socket?.emit("typing", { conversationId, isTyping });
  }
  markRead(conversationId: string): void {
    this.socket?.emit("message:read", { conversationId });
  }
  markDelivered(conversationId: string): void {
    this.socket?.emit("message:delivered", { conversationId });
  }
  // Report window fore/background so the server drives online presence (a hidden/
  // minimized window should not keep the user online).
  setActive(active: boolean): void {
    this.active = active;
    this.socket?.emit("presence:active", { active });
  }
}

export const realtime = new Realtime();
