# Roadmap

## Done

- **v0.6.1** — auth, conversations sidebar, chat with text + attachment
  rendering, realtime (messages/typing/read), light/dark theme, Klic branding.
- **v0.6.2** — voice/video/**group** calls (livekit-client), the full settings
  surface, the ic_klic icon set, a fixed-size auth window, a custom native
  titlebar, and a native macOS menu with an About panel.

## Deferred / next

- **Search** — global message / people search (`/search`).
- **Media viewer** — full-screen image/video lightbox with zoom; today images
  open in the system browser and files download.
- **Push / notifications** — desktop OS notifications for new messages / calls
  while the window is unfocused or backgrounded.
- **Group management** — creating groups, editing title/avatar, adding or
  removing members, roles. (Group *calls* are supported; group *admin* is not.)
- **Sending attachments** — the 3-step upload flow (`POST /me/avatar-upload`
  style presign → `PUT uploadUrl` → reference `key`) is wired for avatars but
  the message composer sends text only; incoming attachments render.
- **Message actions** — reactions, replies, edit, delete, pin, star-from-chat.
  Wire data is typed and partially rendered (deleted state); no action UI yet.
- **Presence** — `presence:update` is received but online/last-seen is not yet
  surfaced in the chat UI.
- **Screen share** — livekit supports it; not surfaced in the call controls.
- **Passkey registration on desktop** — the Passkeys page lists and removes
  existing passkeys; adding a new one (WebAuthn create ceremony) is deferred.
- **Recovery via Google / password reset** — recovery email + change-password
  are wired; Google-email linking and Firebase-hosted password reset are not.
- **Account deletion, contact sync** — endpoints exist; no desktop UI yet.
- **Localization** — the Language page persists a choice locally; the UI ships
  in English only for now.
- **Optimistic send + toasts** — messages append on server ack; no optimistic
  pending state or retry UI.
- **E2EE** — the backend has a disabled `CIPHERTEXT` path; not implemented (and
  the in-app Encryption copy is deliberately honest about transit/at-rest only).
- **Auto-updater** — self-update / release channel wiring.

## Owner action items (OS-level)

- **macOS camera/microphone** — usage strings ship in
  `src-tauri/Info.plist`; the first call triggers the system permission
  prompts. For a notarized/hardened-runtime build, add the
  `com.apple.security.device.camera` and `.audio-input` entitlements.
- Live multi-peer call testing requires a **second signed-in client** (a phone
  or a second desktop instance); a single client can start/ring but needs a
  peer to reach the connected state.
