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
  const [updatePercent, setUpdatePercent] = useState(0);
  const authed = !!session && !!self;
  const prevAuthed = useRef<boolean | null>(null);
  // Version the user dismissed with "Later" — don't re-nag about it this run.
  const dismissedUpdate = useRef<string | null>(null);

  useEffect(() => applyTheme(theme), [theme]);

  // Auto-check for updates on launch, then every 6h while the app stays open
  // (packaged app only; the feed is GitHub Releases, independent of the API).
  useEffect(() => {
    let stopped = false;
    const run = () =>
      checkForUpdate()
        .then((info) => {
          if (stopped || !info) return;
          if (info.version === dismissedUpdate.current) return;
          setUpdate((prev) => prev ?? info);
        })
        .catch(() => {});
    run();
    const timer = setInterval(run, 6 * 60 * 60 * 1000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);

  // Window visibility → presence: a hidden/minimized window shouldn't keep the user
  // showing online. Report the current state, and on every visibility change.
  useEffect(() => {
    const report = () =>
      realtime.setActive(document.visibilityState === "visible");
    report();
    document.addEventListener("visibilitychange", report);
    return () => document.removeEventListener("visibilitychange", report);
  }, []);

  async function runUpdate(info: UpdateInfo) {
    setUpdating(true);
    setUpdatePercent(0);
    try {
      await installUpdate(info, setUpdatePercent);
      // On success the app relaunches; this line rarely runs.
    } catch {
      setUpdating(false);
    }
  }

  function dismissUpdate() {
    dismissedUpdate.current = update?.version ?? null;
    setUpdate(null);
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
              ? `Updating to ${update.version}… ${updatePercent}%`
              : `Klic ${update.version} is available.`}
          </span>
          {updating ? (
            <div className="update-progress">
              <span style={{ width: `${updatePercent}%` }} />
            </div>
          ) : (
            <div className="update-banner-actions">
              <button className="ub-btn" onClick={() => runUpdate(update)}>
                Update &amp; restart
              </button>
              <button className="ub-btn ghost" onClick={dismissUpdate}>
                Later
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
