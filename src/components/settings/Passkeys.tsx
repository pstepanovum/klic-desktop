import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Passkey } from "../../api/types";
import { PageHeader } from "./ui";

export function Passkeys() {
  const [list, setList] = useState<Passkey[] | null>(null);

  useEffect(() => {
    api.passkeys().then(setList).catch(() => setList([]));
  }, []);

  async function remove(id: string) {
    await api.deletePasskey(id).catch(() => {});
    setList((l) => (l ? l.filter((p) => p.id !== id) : l));
  }

  return (
    <div className="settings-detail-inner">
      <PageHeader
        title="Passkeys"
        subtitle="Sign in without a password using a device passkey."
      />
      {list === null ? (
        <div className="list-empty">Loading…</div>
      ) : list.length === 0 ? (
        <div className="list-empty">No passkeys registered.</div>
      ) : (
        list.map((p) => (
          <div className="picker-row" key={p.id}>
            <span className="pr-label">
              {p.label || "Passkey"}
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {" "}
                · added {new Date(p.createdAt).toLocaleDateString()}
              </span>
            </span>
            <button className="btn-secondary" onClick={() => remove(p.id)}>
              Remove
            </button>
          </div>
        ))
      )}
      <div className="info-card" style={{ marginTop: 18 }}>
        Registering a new passkey from desktop is coming soon. You can add
        passkeys from the Klic mobile app and manage them here.
      </div>
    </div>
  );
}
