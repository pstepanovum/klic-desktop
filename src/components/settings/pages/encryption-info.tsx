import { PageHeader } from "../ui";

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
