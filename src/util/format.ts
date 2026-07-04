import type { Conversation, Message, SelfUser } from "../api/types";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// A DM has no title; derive it from the other member.
export function conversationTitle(c: Conversation): string {
  if (c.title) return c.title;
  if (c.members.length > 0) return c.members[0].displayName;
  return "Conversation";
}

export function conversationAvatar(c: Conversation): string | null {
  if (c.avatarUrl) return c.avatarUrl;
  if (c.type === "DIRECT" && c.members[0]) return c.members[0].avatarUrl;
  return null;
}

// Short relative time for the conversation list.
export function shortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const dayMs = 24 * 60 * 60 * 1000;
  if (now.getTime() - d.getTime() < 7 * dayMs) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Clock time inside a message bubble.
export function clockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// One-line preview for a message in the sidebar.
export function messagePreview(m: Message | null): string {
  if (!m) return "No messages yet";
  if (m.deletedAt) return "Message deleted";
  if (m.body) return m.body;
  switch (m.kind) {
    case "IMAGE":
      return "Photo";
    case "VOICE":
      return "Voice message";
    case "VIDEO":
    case "VIDEO_NOTE":
      return "Video";
    case "FILE":
      return "File";
    case "STICKER":
      return "Sticker";
    case "CALL_EVENT":
      return "Call";
    default:
      return m.attachments.length > 0 ? "Attachment" : "";
  }
}

export function displayNameFor(
  senderId: string,
  conversation: Conversation,
  me: SelfUser,
): string {
  if (senderId === me.id) return me.displayName;
  const member = conversation.members.find((u) => u.id === senderId);
  return member?.displayName ?? "Unknown";
}

export function humanSize(bytes: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
