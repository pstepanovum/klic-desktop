import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { PageHeader } from "./ui";
import {
  checkForUpdate,
  installUpdate,
  updaterAvailable,
  type UpdateInfo,
} from "../../util/updater";

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; info: UpdateInfo }
  | { kind: "downloading"; version: string }
  | { kind: "uptodate" }
  | { kind: "error"; message: string };

export function AboutUpdates() {
  const [version, setVersion] = useState("…");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion("desktop"));
  }, []);

  async function check() {
    setState({ kind: "checking" });
    try {
      const info = await checkForUpdate();
      setState(info ? { kind: "available", info } : { kind: "uptodate" });
    } catch {
      setState({
        kind: "error",
        message: "Couldn't reach the update server. Check your connection.",
      });
    }
  }

  async function install(info: UpdateInfo) {
    setState({ kind: "downloading", version: info.version });
    setPercent(0);
    try {
      await installUpdate(info, setPercent);
      // The app relaunches on success; this line rarely runs.
    } catch {
      setState({ kind: "error", message: "The update failed to install." });
    }
  }

  return (
    <div className="settings-detail-inner">
      <PageHeader
        title="About & Updates"
        subtitle="Keep Klic up to date."
      />

      <div className="picker-row">
        <span className="pr-label">Version</span>
        <span className="row-value">{version}</span>
      </div>

      {!updaterAvailable() ? (
        <div className="info-card" style={{ marginTop: 18 }}>
          Automatic updates are available in the installed desktop app.
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          {state.kind === "available" ? (
            <>
              <div className="form-note ok" style={{ marginBottom: 12 }}>
                Version {state.info.version} is available.
              </div>
              {state.info.notes && (
                <div className="info-card" style={{ marginBottom: 14 }}>
                  {state.info.notes}
                </div>
              )}
              <button
                className="btn-primary"
                onClick={() => install(state.info)}
              >
                Download &amp; install
              </button>
            </>
          ) : state.kind === "downloading" ? (
            <>
              <div className="form-note ok">
                Downloading {state.version}… {percent}%
              </div>
              <div className="update-progress">
                <span style={{ width: `${percent}%` }} />
              </div>
            </>
          ) : (
            <>
              <button
                className="btn-primary"
                onClick={check}
                disabled={state.kind === "checking"}
              >
                {state.kind === "checking" ? "Checking…" : "Check for updates"}
              </button>
              {state.kind === "uptodate" && (
                <div className="form-note ok">You're up to date.</div>
              )}
              {state.kind === "error" && (
                <div className="form-note err">{state.message}</div>
              )}
            </>
          )}
        </div>
      )}

      <div className="info-card" style={{ marginTop: 24 }}>
        Klic Desktop — by Pavel Stepanov. Updates are downloaded from the
        official signed GitHub releases and verified before install.
      </div>
    </div>
  );
}
