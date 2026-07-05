# Klic Desktop

Desktop client for **Klic**, a messenger. Built with [Tauri 2](https://tauri.app)
(Rust shell) + [Vite](https://vitejs.dev) + React + TypeScript. It talks to the
existing Klic backend (Fastify REST + Socket.IO); this repo contains no server.

## What it does

- **Auth** — username + password sign-in / registration and a forgot-password
  screen; JWT access + refresh tokens persisted across launches with silent
  refresh on 401. The auth window is a fixed, centered, phone-sized panel; the
  app switches to a resizable two-pane window after sign-in.
- **Chats** — conversations sidebar (avatar, last-message preview, timestamp,
  unread badge) and a chat pane with paginated history, `Enter` to send,
  rendered text + image/file attachments, **stickers**, sender names in groups,
  timestamps, and delivery/read ticks.
- **Realtime** — Socket.IO authenticated with the access token; live incoming
  messages, typing indicators, and read receipts.
- **Calls** — voice, video, and **group** calls over LiveKit (livekit-client):
  start / ring / accept / decline / hang up, mic and camera toggles, a 1:1
  layout and a non-scrolling group grid with active-speaker highlight, plus a
  Recent Calls history with call-back.
- **Friends** — friends list, incoming requests (accept/decline), and a profile
  detail view with remove/block.
- **Settings** — Edit Profile (name/about/links/avatar), Privacy & Security
  (visibility, read receipts, change password, recovery email, blocked users),
  Notifications, Passkeys, Appearance (theme + bubble color), Data & Storage,
  Language, QR code, Saved messages, Encryption info, and Report a problem.
- **Desktop UX** — custom titlebar (no title text; native traffic lights), a
  native macOS menu with an About panel, the Klic icon set (ported from the
  mobile apps), TikTok Sans typography, Klic-red branding, and light/dark/system
  theming.

## Installing

Download the latest installer from the
[Releases](https://github.com/pstepanovum/klic-desktop/releases/latest) page.
Klic isn't code-signed with a paid Apple Developer or Windows certificate yet, so
the **first launch needs one manual "allow" step**. It's a one-time action per
install — after that the app and its auto-updates open normally. The prompts don't
mean anything is wrong with the app; they only mean it isn't notarized yet.

### macOS (Apple Silicon)

1. Open **`Klic_<version>_aarch64.dmg`** and **drag Klic into the Applications
   folder.** Don't launch it from the disk-image window — macOS blocks apps run
   directly off a mounted image (that's the "This item is on the disk image…"
   warning).
2. Open **Klic** from Applications. macOS says it "could not verify" the
   developer — click **Done** (do *not* click Move to Trash).
3. Open **System Settings → Privacy & Security**, scroll to the Security section,
   and next to "Klic was blocked…" click **Open Anyway**, then confirm with
   Touch ID or your password.
4. Klic opens and won't ask again.

If it still refuses (e.g. says the app is "damaged"), clear the download-quarantine
flag in Terminal, then open normally:

```bash
xattr -dr com.apple.quarantine /Applications/Klic.app
```

### Windows

1. Run **`Klic_<version>_x64-setup.exe`** (or the `.msi`).
2. If SmartScreen shows "Windows protected your PC", click **More info → Run
   anyway** — the publisher shows as unverified because the build isn't
   code-signed yet.
3. Follow the installer; auto-updates apply the same way.

> Removing these prompts entirely requires signing certificates (Apple Developer,
> ~$99/yr, for notarization; a Windows Authenticode certificate). Until then the
> one-time "Open Anyway" / "Run anyway" step above is the way in.

## Prerequisites

- **Node.js** 18+ (developed on 24) and npm.
- **Rust** toolchain (stable, 1.77+) via [rustup](https://rustup.rs).
- Platform build dependencies for Tauri — see
  [Tauri prerequisites](https://tauri.app/start/prerequisites/). On macOS this
  is just the Xcode Command Line Tools.
- The Tauri CLI ships as a dev dependency, so `npm install` is enough — no
  global install required.

## Getting started

```bash
npm install
```

### Develop

Run the app with hot-reload (opens the native window):

```bash
npm run tauri dev
```

To iterate on just the web frontend in a browser:

```bash
npm run dev        # Vite dev server on http://localhost:1420
```

### Build

Type-check and build the web bundle:

```bash
npm run build
```

Produce a distributable desktop bundle (`.app`/`.dmg`, `.msi`, `.deb`, …):

```bash
npm run tauri build
```

## Configuration

The backend base URL is compiled from an env var and defaults to the live
server:

| Variable             | Default                          | Notes                                        |
| -------------------- | -------------------------------- | -------------------------------------------- |
| `VITE_API_BASE_URL`  | `https://api.klic.pstepanov.dev` | Origin of the Klic backend. REST calls use the `/api/v1` prefix; Socket.IO connects to the bare origin. |

Override it at build/dev time, e.g.:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run tauri dev
```

No secrets are stored in the repo. Tokens live only in the app's local storage
on the user's machine.

## Project layout

```
src/                 React + TypeScript frontend
  api/               REST client, token storage, wire types
  realtime/          Socket.IO wrapper
  components/        Auth, Sidebar, ChatPane, Avatar
  util/              formatting + theme helpers
  config.ts          API base URL resolution
src-tauri/           Rust shell (Tauri config, icons, entry point)
```

## Wired API endpoints

- `POST /api/v1/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`
- `GET  /api/v1/conversations`
- `GET  /api/v1/conversations/:id/messages` (`before` timestamp cursor, `limit`)
- `POST /api/v1/conversations/:id/messages`
- Socket.IO (bare origin): consumes `message:new`, `typing`, `message:read`;
  emits `typing`, `message:read`, `message:delivered`.

See [ROADMAP.md](./ROADMAP.md) for what's intentionally out of the first slice.

## License

Klic Desktop is released under the [MIT License](LICENSE).
