import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import type { BlockedEntry, SelfUser, Visibility } from "../../api/types";
import { Avatar } from "../avatar";
import { PageHeader, Field, ToggleRow, VisibilityPicker } from "./ui";

interface Props {
  self: SelfUser;
  onUpdated: (u: SelfUser) => void;
}

const VIS_FIELDS: { key: keyof SelfUser; label: string }[] = [
  { key: "lastSeenVisibility", label: "Last seen & online" },
  { key: "avatarVisibility", label: "Profile photo" },
  { key: "aboutVisibility", label: "About" },
  { key: "linksVisibility", label: "Links" },
  { key: "groupsVisibility", label: "Groups" },
  { key: "statusVisibility", label: "Status" },
];

export function PrivacySecurity({ self, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);

  async function patch(field: string, value: unknown) {
    setSaving(true);
    try {
      const updated = await api.updateProfile({ [field]: value } as never);
      onUpdated(updated);
    } catch {
      /* revert handled by parent state on next load */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-detail-inner">
      <PageHeader
        title="Privacy & Security"
        subtitle={saving ? "Saving…" : "Control who can see what, and secure your account."}
      />

      <div className="settings-section-label" style={{ paddingLeft: 0 }}>
        Who can see
      </div>
      {VIS_FIELDS.map((f) => (
        <VisibilityPicker
          key={f.key}
          label={f.label}
          value={(self[f.key] as Visibility) ?? "EVERYBODY"}
          onChange={(v) => patch(f.key, v)}
        />
      ))}

      <div className="settings-section-label" style={{ paddingLeft: 0 }}>
        Preferences
      </div>
      <ToggleRow
        label="Read receipts"
        sub="Send and receive read confirmations."
        on={self.readReceipts}
        onChange={(v) => patch("readReceipts", v)}
      />
      <ToggleRow
        label="Silence unknown callers"
        sub="Calls from people you don't know won't ring."
        on={!!self.silenceUnknownCallers}
        onChange={(v) => patch("silenceUnknownCallers", v)}
      />

      <ChangePassword />
      <RecoveryEmail self={self} onUpdated={onUpdated} />
      <BlockedUsers />
    </div>
  );
}

function ChangePassword() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);

  async function submit() {
    if (next !== confirm) {
      setNote({ ok: false, msg: "New passwords do not match." });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      await api.changePassword(cur, next);
      setNote({ ok: true, msg: "Password changed." });
      setCur("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setNote({
        ok: false,
        msg: e instanceof ApiError ? e.message : "Could not change password.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="settings-section-label" style={{ paddingLeft: 0 }}>
        Change password
      </div>
      <Field label="Current password">
        <input
          className="text-input"
          type="password"
          value={cur}
          onChange={(e) => setCur(e.target.value)}
        />
      </Field>
      <Field label="New password">
        <input
          className="text-input"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </Field>
      <Field label="Confirm new password">
        <input
          className="text-input"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      <button
        className="btn-primary"
        onClick={submit}
        disabled={busy || !cur || next.length < 6}
      >
        {busy ? "Updating…" : "Update password"}
      </button>
      {note && (
        <div className={`form-note ${note.ok ? "ok" : "err"}`}>{note.msg}</div>
      )}
    </>
  );
}

function RecoveryEmail({ self, onUpdated }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);
  const [current, setCurrent] = useState(self.email);
  const [verified, setVerified] = useState(self.emailVerified);

  async function add() {
    setBusy(true);
    setNote(null);
    try {
      const updated = await api.setEmail(email.trim(), password || undefined);
      setCurrent(updated.email);
      setVerified(updated.emailVerified);
      onUpdated(updated);
      setNote({ ok: true, msg: "Verification email sent." });
      setEmail("");
      setPassword("");
    } catch (e) {
      setNote({
        ok: false,
        msg: e instanceof ApiError ? e.message : "Could not set email.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.removeEmail();
      setCurrent(null);
      setVerified(false);
      onUpdated({ ...self, email: null, emailVerified: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="settings-section-label" style={{ paddingLeft: 0 }}>
        Recovery email
      </div>
      {current ? (
        <div className="picker-row">
          <span className="pr-label">
            {current}{" "}
            <span style={{ color: verified ? "var(--read-green)" : "var(--text-muted)" }}>
              · {verified ? "Verified" : "Pending"}
            </span>
          </span>
          <button className="btn-secondary" onClick={remove} disabled={busy}>
            Remove
          </button>
        </div>
      ) : (
        <>
          <Field label="Email address">
            <input
              className="text-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Current password (optional)">
            <input
              className="text-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button
            className="btn-primary"
            onClick={add}
            disabled={busy || !email.includes("@")}
          >
            {busy ? "Saving…" : "Add recovery email"}
          </button>
        </>
      )}
      {note && (
        <div className={`form-note ${note.ok ? "ok" : "err"}`}>{note.msg}</div>
      )}
    </>
  );
}

function BlockedUsers() {
  const [list, setList] = useState<BlockedEntry[] | null>(null);

  useEffect(() => {
    api.blocks().then(setList).catch(() => setList([]));
  }, []);

  async function unblock(userId: string) {
    await api.unblock(userId).catch(() => {});
    setList((l) => (l ? l.filter((e) => e.user.id !== userId) : l));
  }

  return (
    <>
      <div className="settings-section-label" style={{ paddingLeft: 0 }}>
        Blocked users
      </div>
      {list === null ? (
        <div className="list-empty">Loading…</div>
      ) : list.length === 0 ? (
        <div className="list-empty">You haven't blocked anyone.</div>
      ) : (
        list.map((e) => (
          <div className="picker-row" key={e.user.id}>
            <span
              className="pr-label"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <Avatar url={e.user.avatarUrl} name={e.user.displayName} size="sm" />
              {e.user.displayName}
            </span>
            <button
              className="btn-secondary"
              onClick={() => unblock(e.user.id)}
            >
              Unblock
            </button>
          </div>
        ))
      )}
    </>
  );
}
