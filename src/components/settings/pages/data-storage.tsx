import { useState } from "react";
import { PageHeader } from "../ui";

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
