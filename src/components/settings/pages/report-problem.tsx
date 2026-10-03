import { useState } from "react";
import { api, ApiError } from "../../../api/client";
import { PageHeader, Field } from "../ui";

// ---- Report a problem ----
// Values must match the server's ReportCategory enum.
const CATEGORIES = [
  { value: "OTHER", label: "Bug or other problem" },
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "IMPERSONATION", label: "Impersonation" },
  { value: "SCAM_FRAUD", label: "Scam or fraud" },
];
export function ReportProblem() {
  const [category, setCategory] = useState("OTHER");
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
            <option key={c.value} value={c.value}>
              {c.label}
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
