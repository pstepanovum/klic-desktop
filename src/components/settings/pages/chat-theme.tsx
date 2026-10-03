import { useState } from "react";
import { PageHeader, Field } from "../ui";
import {
  BUBBLE_COLORS,
  loadBubbleColor,
  applyBubbleColor,
  PATTERN_IDS,
  loadPattern,
  applyPattern,
} from "../../../util/chat-theme";
import type { Theme } from "../../../util/theme";

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
