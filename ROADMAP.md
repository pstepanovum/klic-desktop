# Roadmap

The first release (v0.6.1) is a clean, working slice: auth, conversations,
chat with text + attachment rendering, and realtime. The items below are
deliberately out of scope for that slice and are planned next.

## Deferred (out of the first slice)

- **Voice / video calls** — the backend supports LiveKit calls and `call:*`
  socket events; the desktop client does not join or place calls yet.
- **Search** — global message / people search (`/search`).
- **Account recovery** — password reset, email verification flows, passkeys.
- **Media viewer** — full-screen image/video lightbox with zoom; today images
  open in the system browser and files download.
- **Push / notifications** — desktop OS notifications for new messages while the
  window is unfocused or in the background.
- **Group management** — creating groups, editing title/avatar, adding or
  removing members, roles.

## Additionally deferred during implementation

- **Sending attachments** — the 3-step upload flow (`POST /uploads` →
  `PUT uploadUrl` → reference `key` in the message) is understood but the
  composer currently sends text only; incoming attachments are rendered.
- **Message actions** — reactions, replies, edit, delete, pin, stars. The wire
  data (`reactions`, `replyTo`, `editedAt`, `pinnedAt`) is typed and partially
  rendered (deleted state), but no UI to perform these actions yet.
- **Presence** — `presence:update` is received; online/last-seen is not yet
  surfaced in the UI.
- **Optimistic send + failure toasts** — messages are appended on server
  acknowledgement; there is no optimistic pending state or send-failure retry UI.
- **Stickers, voice notes, video notes** — recognized in previews; no dedicated
  playback/record UI.
- **E2EE** — the backend has a `CIPHERTEXT` message path; the desktop client
  does not implement the encryption layer.
- **Auto-updater** — self-update / release channel wiring for the desktop app.
- **Settings** — profile editing (display name, avatar, about), privacy
  toggles, and read-receipt preferences.
