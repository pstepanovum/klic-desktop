import { useState } from "react";
import { PageHeader, Field } from "../ui";

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
