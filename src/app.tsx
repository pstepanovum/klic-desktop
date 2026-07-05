import { useEffect, useRef, useState } from "react";
import { api } from "./api/client";
import {
  loadSession,
  saveSession,
  clearSession,
  getRefreshToken,
  type Session,
} from "./api/tokens";
import type { SelfUser } from "./api/types";
import { realtime } from "./realtime/socket";
import { AuthScreen } from "./components/auth-screen";
import { Titlebar } from "./components/titlebar";
import { Workspace } from "./workspace";
import { CallProvider } from "./calls/call-provider";
import { loadTheme, applyTheme, nextTheme, type Theme } from "./util/theme";
import { applyAuthWindow, applyAppWindow } from "./util/window";
import { checkForUpdate, installUpdate, type UpdateInfo } from "./util/updater";

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [self, setSelf] = useState<SelfUser | null>(
    () => loadSession()?.user ?? null,
  );
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [search, setSearch] = useState("");
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updating, setUpdating] = useState(false);
  const authed = !!session && !!self;
  const prevAuthed = useRef<boolean | null>(null);

  useEffect(() => applyTheme(theme), [theme]);

  // One throttled auto-check for updates on launch (packaged app only).
  useEffect(() => {
    const KEY = "klic.lastUpdateCheck";
    const last = Number(localStorage.getItem(KEY) || 0);
    if (Date.now() - last < 6 * 60 * 60 * 1000) return; // at most every 6h
    localStorage.setItem(KEY, String(Date.now()));
    checkForUpdate()
      .then((info) => info && setUpdate(info))
      .catch(() => {});
  }, []);

  async function runUpdate(info: UpdateInfo) {
    setUpdating(true);
    try {
      await installUpdate(info);
    } catch {
      setUpdating(false);
    }
  }

  // Resize the native window when moving between auth and the app.
  useEffect(() => {
    if (prevAuthed.current === authed) return;
    prevAuthed.current = authed;
    if (authed) applyAppWindow();
    else applyAuthWindow();
  }, [authed]);

  function onAuthed(s: Session) {
    saveSession(s);
    setSession(s);
    setSelf(s.user);
  }

  function updateSelf(u: SelfUser) {
    setSelf(u);
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, user: u };
      saveSession(next);
      return next;
    });
  }

  function doLogout() {
    const rt = getRefreshToken();
    if (rt) api.logout(rt).catch(() => {});
    realtime.disconnect();
    clearSession();
    setSession(null);
    setSelf(null);
  }

  return (
    <div className="root-shell">
      <Titlebar
        variant={authed ? "app" : "auth"}
        search={search}
        onSearch={authed ? setSearch : undefined}
        theme={theme}
        onToggleTheme={authed ? () => setTheme((t) => nextTheme(t)) : undefined}
      />
      <div className="root-body">
        {authed && session && self ? (
          <CallProvider selfId={self.id}>
            <Workspace
              session={session}
              self={self}
              theme={theme}
              search={search}
              onSetTheme={setTheme}
              onUpdateSelf={updateSelf}
              onLogout={doLogout}
            />
          </CallProvider>
        ) : (
          <AuthScreen onAuthed={onAuthed} />
        )}
      </div>
      {update && (
        <div className="update-banner">
          <span>
            {updating
              ? `Updating to ${update.version}…`
              : `Klic ${update.version} is available.`}
          </span>
          {!updating && (
            <div className="update-banner-actions">
              <button className="ub-btn" onClick={() => runUpdate(update)}>
                Update &amp; restart
              </button>
              <button className="ub-btn ghost" onClick={() => setUpdate(null)}>
                Later
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
