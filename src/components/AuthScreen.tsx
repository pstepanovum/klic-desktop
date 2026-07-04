import { useState, FormEvent } from "react";
import { api, ApiError } from "../api/client";
import type { Session } from "../api/tokens";

interface Props {
  onAuthed: (session: Session) => void;
}

type Mode = "login" | "register";

export function AuthScreen({ onAuthed }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await api.login(username.trim(), password)
          : await api.register(username.trim(), password, displayName.trim());
      onAuthed({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    username.trim().length > 0 &&
    password.length > 0 &&
    (mode === "login" || displayName.trim().length > 0);

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Klic" />
          <h1>Klic</h1>
        </div>
        <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
        <form onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {mode === "register" && (
            <div className="field">
              <label>Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn" type="submit" disabled={!canSubmit || busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <div className="auth-switch">
          {mode === "login" ? (
            <>
              New to Klic?{" "}
              <button
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
