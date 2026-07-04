import { useRef, useState } from "react";
import { api, ApiError } from "../../api/client";
import type { SelfUser } from "../../api/types";
import { Avatar } from "../Avatar";
import { PageHeader, Field } from "./ui";

interface Props {
  self: SelfUser;
  onUpdated: (u: SelfUser) => void;
}

export function EditProfile({ self, onUpdated }: Props) {
  const [displayName, setDisplayName] = useState(self.displayName);
  const [about, setAbout] = useState(self.about ?? "");
  const [links, setLinks] = useState<string[]>(self.links ?? []);
  const [newLink, setNewLink] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(self.avatarUrl);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function addLink() {
    const v = newLink.trim();
    if (!v) return;
    const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    if (links.length >= 5) return;
    setLinks([...links, url]);
    setNewLink("");
  }

  async function uploadAvatar(file: File) {
    setBusy(true);
    setNote(null);
    try {
      const presign = await api.avatarUpload(file.type, file.size);
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed");
      const updated = await api.updateProfile({ avatarKey: presign.key });
      setAvatarUrl(updated.avatarUrl);
      onUpdated(updated);
      setNote({ ok: true, msg: "Avatar updated" });
    } catch (e) {
      setNote({
        ok: false,
        msg:
          e instanceof ApiError
            ? e.message
            : "Could not upload avatar (storage may be unavailable).",
      });
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setNote(null);
    try {
      const updated = await api.updateProfile({
        displayName: displayName.trim(),
        about: about.trim() ? about.trim() : null,
        links: links.length ? links : null,
      });
      onUpdated(updated);
      setNote({ ok: true, msg: "Profile saved" });
    } catch (e) {
      setNote({
        ok: false,
        msg: e instanceof ApiError ? e.message : "Could not save profile.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-detail-inner">
      <PageHeader title="Edit profile" subtitle="How others see you on Klic." />

      <div className="avatar-edit">
        <Avatar url={avatarUrl} name={displayName || self.username} />
        <div>
          <button
            className="btn-secondary"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            Change photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <Field label="Display name">
        <input
          className="text-input"
          value={displayName}
          maxLength={40}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </Field>

      <Field label="Username">
        <input className="text-input" value={`@${self.username}`} disabled />
      </Field>

      <Field label="About">
        <textarea
          className="text-area"
          value={about}
          maxLength={140}
          placeholder="A few words about you"
          onChange={(e) => setAbout(e.target.value)}
        />
      </Field>

      <Field label="Links">
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="text-input"
            value={newLink}
            placeholder="https://…"
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <button
            className="btn-secondary"
            onClick={addLink}
            disabled={links.length >= 5}
          >
            Add
          </button>
        </div>
        <div className="chip-list">
          {links.map((l, i) => (
            <span className="chip" key={i}>
              {l}
              <button onClick={() => setLinks(links.filter((_, j) => j !== i))}>
                ×
              </button>
            </span>
          ))}
        </div>
      </Field>

      <button
        className="btn-primary"
        onClick={save}
        disabled={busy || displayName.trim().length === 0}
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
      {note && (
        <div className={`form-note ${note.ok ? "ok" : "err"}`}>{note.msg}</div>
      )}
    </div>
  );
}
