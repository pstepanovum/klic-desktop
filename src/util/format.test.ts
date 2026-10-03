import { describe, expect, it } from "vitest";
import type { Conversation, Message, PublicUser, SelfUser } from "../api/types";
import {
  conversationTitle,
  displayNameFor,
  humanSize,
  initials,
  messagePreview,
} from "./format";

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: "m1",
    conversationId: "c1",
    senderId: "u1",
    body: "",
    kind: "TEXT",
    createdAt: "2026-01-01T00:00:00.000Z",
    attachments: [],
    ...overrides,
  };
}

function user(id: string, displayName: string): PublicUser {
  return { id, username: id, displayName, avatarUrl: null };
}

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "c1",
    type: "DIRECT",
    avatarUrl: null,
    members: [],
    lastMessage: null,
    ...overrides,
  };
}

const me: SelfUser = {
  id: "me",
  username: "me",
  displayName: "Me Myself",
  avatarUrl: null,
  about: null,
  links: [],
  email: null,
  emailVerified: false,
  readReceipts: true,
};

describe("messagePreview", () => {
  it("handles an empty conversation", () => {
    expect(messagePreview(null)).toBe("No messages yet");
  });

  it("prefers the deleted marker over the body", () => {
    expect(
      messagePreview(message({ body: "secret", deletedAt: "2026-01-02" })),
    ).toBe("Message deleted");
  });

  it("shows the body text when present, whatever the kind", () => {
    expect(messagePreview(message({ body: "hello" }))).toBe("hello");
    expect(messagePreview(message({ body: "caption", kind: "IMAGE" }))).toBe(
      "caption",
    );
  });

  it.each([
    ["IMAGE", "Photo"],
    ["VOICE", "Voice message"],
    ["VIDEO", "Video"],
    ["VIDEO_NOTE", "Video"],
    ["FILE", "File"],
    ["STICKER", "Sticker"],
    ["CALL_EVENT", "Call"],
  ] as const)("labels a bodiless %s message as %s", (kind, label) => {
    expect(messagePreview(message({ kind }))).toBe(label);
  });

  it("falls back to Attachment or an empty string for other kinds", () => {
    const att = {
      id: "a1",
      kind: "FILE",
      url: "https://example.com/f",
    } as unknown as Message["attachments"][number];
    expect(messagePreview(message({ attachments: [att] }))).toBe("Attachment");
    expect(messagePreview(message())).toBe("");
  });
});

describe("displayNameFor", () => {
  const convo = conversation({ members: [user("u1", "Alice")] });

  it("uses my own display name for my messages", () => {
    expect(displayNameFor("me", convo, me)).toBe("Me Myself");
  });

  it("looks up other senders among the members", () => {
    expect(displayNameFor("u1", convo, me)).toBe("Alice");
  });

  it("returns Unknown for senders who are no longer members", () => {
    expect(displayNameFor("gone", convo, me)).toBe("Unknown");
  });
});

describe("conversationTitle", () => {
  it("uses an explicit title", () => {
    expect(
      conversationTitle(
        conversation({ type: "GROUP", title: "Crew", members: [user("u1", "A")] }),
      ),
    ).toBe("Crew");
  });

  it("derives a DM title from the other member", () => {
    expect(
      conversationTitle(conversation({ members: [user("u1", "Alice")] })),
    ).toBe("Alice");
  });

  it("falls back when there is nothing to go on", () => {
    expect(conversationTitle(conversation())).toBe("Conversation");
  });
});

describe("initials", () => {
  it("takes first and last word initials", () => {
    expect(initials("ada byron lovelace")).toBe("AL");
  });

  it("takes two letters of a single word", () => {
    expect(initials("  klic ")).toBe("KL");
  });

  it("returns ? for a blank name", () => {
    expect(initials("   ")).toBe("?");
  });
});

describe("humanSize", () => {
  it.each([
    [0, ""],
    [512, "512 B"],
    [1536, "1.5 KB"],
    [20 * 1024, "20 KB"],
    [5 * 1024 * 1024, "5.0 MB"],
    [3 * 1024 ** 4, "3072 GB"],
  ])("formats %d bytes as %j", (bytes, expected) => {
    expect(humanSize(bytes)).toBe(expected);
  });
});
