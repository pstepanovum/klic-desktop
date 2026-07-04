// Wire shapes mirror the Klic backend (/api/v1). Field names match the server
// JSON exactly so payloads decode verbatim.

export interface SelfUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  about: string | null;
  links: string[];
  email: string | null;
  emailVerified: boolean;
  readReceipts: boolean;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  about?: string | null;
  links?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SelfUser;
}

export type MessageKind =
  | "TEXT"
  | "IMAGE"
  | "VOICE"
  | "VIDEO"
  | "VIDEO_NOTE"
  | "FILE"
  | "CALL_EVENT"
  | "STICKER"
  | "SYSTEM"
  | "CIPHERTEXT";

export type AttachmentKind = "IMAGE" | "VOICE" | "VIDEO" | "VIDEO_NOTE" | "FILE";

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  url: string;
  contentType: string;
  byteSize: number;
  width?: number;
  height?: number;
  durationMs?: number;
  fileName?: string;
}

export type MessageStatus = "sent" | "delivered" | "read";

export interface Reaction {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface ReplyPreview {
  id: string;
  senderId: string;
  kind: MessageKind;
  preview: string;
  deleted?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  kind: MessageKind;
  createdAt: string;
  attachments: Attachment[];
  status?: MessageStatus;
  stickerUrl?: string;
  replyTo?: ReplyPreview;
  reactions?: Reaction[];
  deletedAt?: string;
  editedAt?: string;
  pinnedAt?: string;
}

export type ConversationType = "DIRECT" | "GROUP";

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  description?: string;
  avatarUrl: string | null;
  createdById?: string;
  createdAt?: string;
  members: PublicUser[];
  lastMessage: Message | null;
  unreadCount?: number;
}

// ---- Realtime payloads ----
export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ReadEvent {
  conversationId: string;
  userId: string;
  readAt: string;
}

export interface PresenceEvent {
  userId: string;
  online: boolean;
  lastSeen?: string | null;
}
