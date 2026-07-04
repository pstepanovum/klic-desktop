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

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [self, setSelf] = useState<SelfUser | null>(
    () => loadSession()?.user ?? null,
  );
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [search, setSearch] = useState("");
  const authed = !!session && !!self;
  const prevAuthed = useRef<boolean | null>(null);

  useEffect(() => applyTheme(theme), [theme]);

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
    </div>
  );
}
