import { useState } from "react";
import { api, ApiError } from "../../api/client";
import { PageHeader, Field } from "./ui";
import {
  BUBBLE_COLORS,
  loadBubbleColor,
  applyBubbleColor,
  PATTERN_IDS,
  loadPattern,
  applyPattern,
} from "../../util/chatTheme";
import type { Theme } from "../../util/theme";

const THEME_MODES: { id: Theme; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

// ---- Appearance: theme mode + bubble color (local) ----
export function ChatThemePage({
  theme,
  onSetTheme,
}: {
  theme: Theme;
  onSetTheme: (t: Theme) => void;
}) {
  const [color, setColor] = useState(loadBubbleColor());
  const [pattern, setPattern] = useState(loadPattern());
  return (
    <div className="settings-detail-inner">
      <PageHeader
        title="Appearance"
        subtitle="Theme and chat colors. Saved on this device."
      />
      <Field label="Theme">
        <div className="segmented">
          {THEME_MODES.map((m) => (
            <button
              key={m.id}
              className={`seg-btn ${theme === m.id ? "active" : ""}`}
              onClick={() => onSetTheme(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="field-group">
        <label>Sent-message bubble</label>
      </div>
      <div className="msg-row out" style={{ marginBottom: 20 }}>
        <div className="bubble">
          <div className="bubble-text">Here's how your messages will look.</div>
          <div className="bubble-meta">
            <span>9:41</span>
            <span className="tick read">✓✓</span>
          </div>
        </div>
      </div>
      <div className="chip-list">
        {BUBBLE_COLORS.map((c) => (
          <button
            key={c.id}
            title={c.name}
            onClick={() => {
              setColor(c.color);
              applyBubbleColor(c.color);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: c.color,
              border:
                color === c.color
                  ? "3px solid var(--text)"
                  : "3px solid transparent",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      <div className="field-group" style={{ marginTop: 26 }}>
        <label>Chat background</label>
      </div>
      <div className="pattern-grid">
        {PATTERN_IDS.map((id) => (
          <button
            key={id}
            className={`pattern-cell ${pattern === id ? "active" : ""}`}
            onClick={() => {
              setPattern(id);
              applyPattern(id);
            }}
            title={id === 0 ? "None" : `Pattern ${id}`}
            style={
              id > 0
                ? {
                    backgroundImage: `url("/patterns/${id}.svg")`,
                    backgroundSize: "220px",
                  }
                : undefined
            }
          >
            {id === 0 && "None"}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Data & storage (local) ----
export function DataStorage() {
  const [cleared, setCleared] = useState(false);
  function clearCache() {
    // Only clear our own cache keys, never the auth session.
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith("klic.cache")) localStorage.removeItem(k);
    }
    setCleared(true);
  }
  return (
    <div className="settings-detail-inner">
      <PageHeader
        title="Data & Storage"
        subtitle="Manage local cache and media handling on this device."
      />
      <div className="info-card">
        Media and attachments are streamed from Klic's servers on demand and are
        not permanently stored on this device. Managed locally.
      </div>
      <div style={{ marginTop: 18 }}>
        <button className="btn-secondary" onClick={clearCache}>
          Clear local cache
        </button>
        {cleared && <div className="form-note ok">Local cache cleared.</div>}
      </div>
    </div>
  );
}

// ---- Language (local) ----
const LANGS = [
  { id: "system", label: "System default" },
  { id: "en", label: "English" },
  { id: "ru", label: "Русский" },
  { id: "zh", label: "中文" },
];
export function Language() {
  const [lang, setLang] = useState(
    () => localStorage.getItem("klic.lang") || "system",
  );
  return (
    <div className="settings-detail-inner">
      <PageHeader
        title="Language"
        subtitle="Interface language for this device."
      />
      <Field label="Language">
        <select
          className="select-input"
          value={lang}
          onChange={(e) => {
            setLang(e.target.value);
            localStorage.setItem("klic.lang", e.target.value);
          }}
        >
          {LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="info-card">
        Full localization is on the roadmap; the interface currently ships in
        English.
      </div>
    </div>
  );
}

// ---- Encryption (honest transit + at-rest wording, NOT E2EE) ----
export function EncryptionInfo() {
  return (
    <div className="settings-detail-inner">
      <PageHeader title="Encryption" subtitle="How your data is protected." />
      <div className="info-card">
        <p style={{ marginTop: 0 }}>
          Your messages and calls are encrypted <strong>in transit</strong>{" "}
          (TLS) and <strong>at rest</strong> (on Klic's servers and disks). Klic
          operates the servers that carry and store your content.
        </p>
        <p>
          Klic does not currently offer end-to-end encryption, so this is not a
          "only you and the recipient can read it" guarantee. We're working
          toward end-to-end encryption for a future release.
        </p>
      </div>
    </div>
  );
}

// ---- Report a problem ----
const CATEGORIES = [
  "BUG",
  "ABUSE",
  "SPAM",
  "HARASSMENT",
  "IMPERSONATION",
  "OTHER",
];
export function ReportProblem() {
  const [category, setCategory] = useState("BUG");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);

  async function submit() {
    setBusy(true);
    setNote(null);
    try {
      await api.report(category, details.trim() || undefined);
      setNote({ ok: true, msg: "Thanks — your report was sent." });
      setDetails("");
    } catch (e) {
      setNote({
        ok: false,
        msg: e instanceof ApiError ? e.message : "Could not send report.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-detail-inner">
      <PageHeader
        title="Report a problem"
        subtitle="Tell us what went wrong and we'll look into it."
      />
      <Field label="Category">
        <select
          className="select-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Details">
        <textarea
          className="text-area"
          value={details}
          maxLength={1000}
          placeholder="Describe the issue…"
          onChange={(e) => setDetails(e.target.value)}
        />
      </Field>
      <button className="btn-primary" onClick={submit} disabled={busy}>
        {busy ? "Sending…" : "Send report"}
      </button>
      {note && (
        <div className={`form-note ${note.ok ? "ok" : "err"}`}>{note.msg}</div>
      )}
    </div>
  );
}
