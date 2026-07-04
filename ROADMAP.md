# Roadmap

## Done

- **v0.6.1** — auth, conversations sidebar, chat with text + attachment
  rendering, realtime, light/dark theme, Klic branding.
- **v0.6.2** — voice/video/**group** calls (livekit-client) with active-speaker
  grid + recent-calls history; the full settings surface; **Friends** (list,
  requests, profile detail); **stickers**; message **reactions / reply / copy /
  star** context menu; auto-linked URLs; the Klic icon set (352 glyphs);
  fixed-size auth window + forgot-password screen; custom titlebar; native macOS
  menu (About / Pavel Stepanov); a squircle app icon; TikTok Sans + Bangers;
  grayscale stroke-free UI with fully rounded controls.

## Deferred / next

- **Sending pictures & files** — the upload flow is understood
  (`POST /uploads {conversationId,kind,contentType,byteSize}` → `PUT uploadUrl`
  → send message with `attachments:[{key,kind}]`). Incoming media of every kind
  renders (image/video/voice/file); the composer's attach button is not wired
  yet.
- **Screen share** — livekit supports `setScreenShareEnabled`, but macOS
  WKWebView `getDisplayMedia` needs a native display-capture permission handler
  (see the server/host note below). Deferred until that's in place.
- **Chat theme patterns & gradients** — the bubble-color palette and Light/Dark/
  System theme are done. The 10 background patterns + gradient presets
  (`klic-assets/chat-them/*.svg`) and the group theme (`PATCH /conversations/:id`)
  are not yet implemented.
- **Conversation info panel** — shared Media / Files / Links tabs
  (`GET /conversations/:id/attachments`).
- **Message edit / delete / pin** — reactions, reply, star are wired; edit,
  delete, and pin are not.
- **Search** — global message / people search (`/search`).
- **Media viewer** — full-screen image/video lightbox with zoom.
- **Push / notifications** — desktop OS notifications for messages / calls.
- **Group management** — create groups, edit title/avatar, members, roles.
- **Passkey registration on desktop** — list + remove are wired; the WebAuthn
  create ceremony is deferred.
- **Presence** — `presence:update` received; not surfaced in the UI.
- **Localization** — the Language page persists a choice locally; UI is English.
- **Optimistic send + toasts**, **auto-updater**, **E2EE** (server ciphertext
  path is disabled; the Encryption page states transit/at-rest honestly).

## Owner action items (OS / server / host)

- **macOS camera/microphone** — usage strings ship in `src-tauri/Info.plist`;
  the first call triggers the system prompts. A notarized/hardened build should
  add the `com.apple.security.device.camera` / `.audio-input` entitlements.
- **Screen share** needs the host to grant WKWebView display-capture permission
  (macOS 13+, `SCContentSharingPicker`) — flagged for the desktop shell.
- **Live multi-peer call testing** requires a second signed-in client (phone or
  a second desktop instance).
