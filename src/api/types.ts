// Wire shapes mirror the Klic backend (/api/v1). Field names match the server
// JSON exactly so payloads decode verbatim.

export type Visibility = "EVERYBODY" | "FRIENDS" | "NOBODY";

export interface SelfUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  about: string | null;
  links: string[];
  email: string | null;
  emailVerified: boolean;
  showLastSeen?: boolean;
  deleteIfAwayMonths?: number | null;
  lastSeenVisibility?: Visibility;
  aboutVisibility?: Visibility;
  avatarVisibility?: Visibility;
  linksVisibility?: Visibility;
  groupsVisibility?: Visibility;
  statusVisibility?: Visibility;
  silenceUnknownCallers?: boolean;
  readReceipts: boolean;
}

// Subset of PATCH /me fields the desktop client edits.
export interface ProfilePatch {
  displayName?: string;
  username?: string;
  about?: string | null;
  links?: string[] | null;
  avatarKey?: string | null;
  lastSeenVisibility?: Visibility;
  aboutVisibility?: Visibility;
  avatarVisibility?: Visibility;
  linksVisibility?: Visibility;
  groupsVisibility?: Visibility;
  statusVisibility?: Visibility;
  silenceUnknownCallers?: boolean;
  readReceipts?: boolean;
  deleteIfAwayMonths?: number | null;
}

export interface NotificationPrefs {
  messages: boolean;
  groups: boolean;
  calls: boolean;
  friendRequests: boolean;
}

export interface BlockedEntry {
  user: PublicUser;
  blockedAt: string;
}

export interface Passkey {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface StarredMessage extends Message {
  starred?: boolean;
  sender?: PublicUser;
  conversation?: { id: string; type: ConversationType; title?: string };
}

export interface StarredPage {
  items: StarredMessage[];
  nextCursor: string | null;
}

export interface EmailStatus {
  email: string | null;
  emailVerified: boolean;
}

// ---- Calls ----
export type CallKind = "AUDIO" | "VIDEO";
export type CallStatus = "RINGING" | "ANSWERING" | "ONGOING" | "ENDED";

export interface CallInvite {
  callId: string;
  conversationId: string;
  roomName: string;
  livekitUrl: string;
  kind: CallKind;
  from: { id: string; username: string; displayName: string };
  conversationType: ConversationType;
  conversationTitle: string;
  participantCount: number;
  silenced?: boolean;
}

// POST /calls response = CallInvite + token + status.
export interface CallStart extends CallInvite {
  token: string;
  status: CallStatus;
}

export interface CallToken {
  callId: string;
  roomName: string;
  livekitUrl: string;
  kind: CallKind;
  token: string;
}

export interface ActiveCall {
  callId: string;
  conversationId: string;
  roomName: string;
  livekitUrl: string;
  kind: CallKind;
  status: CallStatus;
  startedBy: string;
  participants: { userId: string; joinedAt: string | null }[];
}

export interface CallSignal {
  callId: string;
  userId?: string;
  reason?: string;
  outcome?: string;
}

export interface CallHistoryItem {
  id: string;
  conversationId: string;
  kind: CallKind;
  outgoing: boolean;
  outcome: string;
  startedAt: string;
  durationMs?: number;
  participants: PublicUser[];
}

export interface FriendRequest {
  requestId: string;
  from: { id: string; username: string; displayName: string };
}

export interface Sticker {
  id: string;
  url: string;
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
  call?: { kind: CallKind; outcome: string; durationMs?: number };
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
