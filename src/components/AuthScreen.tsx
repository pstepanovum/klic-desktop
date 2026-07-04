import { useMemo, useState, FormEvent } from "react";
import { api, ApiError } from "../api/client";
import type { Session } from "../api/tokens";

interface Props {
  onAuthed: (session: Session) => void;
}

type Mode = "login" | "register";

// Password strength model mirrors iOS SignUpView.strength.
function strengthOf(pw: string): { bars: number; label: string; color: string } {
  if (!pw) return { bars: 0, label: "", color: "transparent" };
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  if (pw.length < 8) return { bars: 1, label: "Weak", color: "#ef4444" };
  if (!hasUpper && !hasDigit) return { bars: 2, label: "Fair", color: "#f59e0b" };
  if (hasUpper && hasDigit && hasSpecial)
    return { bars: 4, label: "Strong", color: "#2ecc71" };
  return { bars: 3, label: "Good", color: "#8bc34a" };
}

export function AuthScreen({ onAuthed }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";
  const strength = useMemo(() => strengthOf(password), [password]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = isLogin
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
    (isLogin || (displayName.trim().length > 0 && agreed));

  return (
    <div className="auth">
      <img
        className="auth-art"
        src={isLogin ? "/auth-login.svg" : "/auth-signup.svg"}
        alt=""
        draggable={false}
      />
      <div className="auth-sheet" />

      <div className="auth-content">
        <h1 className="auth-title">{isLogin ? "Login" : "Sign Up"}</h1>
        <p className="auth-subtitle">
          {isLogin
            ? "Welcome back — sign in to keep chatting."
            : "Yo! Let's create an account for you"}
        </p>

        <form onSubmit={submit}>
          <div className="auth-fields">
            <label className="pill-field">
              <span className="prefix">@</span>
              <input
                value={username}
                placeholder="Username"
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>

            {!isLogin && (
              <label className="pill-field">
                <input
                  value={displayName}
                  placeholder="Display name"
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
            )}

            <label className="pill-field">
              <input
                type="password"
                value={password}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {!isLogin && password.length > 0 && (
              <div className="strength">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="seg"
                    style={
                      i < strength.bars
                        ? { background: strength.color }
                        : undefined
                    }
                  />
                ))}
                <span className="label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {isLogin && (
            <button type="button" className="auth-forgot" tabIndex={-1}>
              Forgot password?
            </button>
          )}

          {!isLogin && (
            <div className="privacy-row">
              <span
                className={`privacy-box ${agreed ? "on" : ""}`}
                onClick={() => setAgreed((v) => !v)}
                role="checkbox"
                aria-checked={agreed}
              >
                {agreed ? "✓" : ""}
              </span>
              <span>I agree to the Terms and Privacy Policy</span>
            </div>
          )}

          <button
            className="pill-btn"
            type="submit"
            disabled={busy || (!isLogin && !canSubmit)}
          >
            {busy ? "Please wait…" : isLogin ? "Login" : "Sign up"}
          </button>

          {error && <div className="auth-error">{error}</div>}
        </form>

        <button
          className="auth-link"
          onClick={() => switchMode(isLogin ? "register" : "login")}
        >
          {isLogin ? "Create an account" : "I already have an account"}
        </button>
      </div>
    </div>
  );
}
