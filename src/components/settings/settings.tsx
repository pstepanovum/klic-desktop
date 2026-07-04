import { useState } from "react";
import type { SelfUser } from "../../api/types";
import { Avatar } from "../avatar";
import { Icon, type IconName } from "../../icons/icon";
import type { Theme } from "../../util/theme";
import { EditProfile } from "./edit-profile";
import { PrivacySecurity } from "./privacy-security";
import { Notifications } from "./notifications";
import { Passkeys } from "./passkeys";
import { SavedMessages } from "./saved-messages";
import { QrCode } from "./qr-code";
import {
  ChatThemePage,
  DataStorage,
  Language,
  EncryptionInfo,
  ReportProblem,
} from "./misc-pages";

type PageId =
  | "profile"
  | "notifications"
  | "privacy"
  | "passkeys"
  | "theme"
  | "data"
  | "language"
  | "qr"
  | "saved"
  | "encryption"
  | "report";

const MENU: { id: PageId; icon: IconName; label: string }[] = [
  { id: "profile", icon: "tab_user", label: "Edit profile" },
  { id: "notifications", icon: "bell", label: "Notifications" },
  { id: "privacy", icon: "passcode", label: "Privacy & Security" },
  { id: "passkeys", icon: "passkey", label: "Passkeys" },
  { id: "theme", icon: "appearance", label: "Appearance" },
  { id: "data", icon: "storage", label: "Data & Storage" },
  { id: "language", icon: "language", label: "Language" },
  { id: "qr", icon: "qr", label: "QR code" },
  { id: "saved", icon: "star_solid", label: "Saved messages" },
  { id: "encryption", icon: "passcode", label: "Encryption" },
  { id: "report", icon: "report", label: "Report a problem" },
];

interface Props {
  self: SelfUser;
  theme: Theme;
  onSetTheme: (t: Theme) => void;
  onUpdated: (u: SelfUser) => void;
  onLogout: () => void;
}

export function Settings({ self, theme, onSetTheme, onUpdated, onLogout }: Props) {
  const [page, setPage] = useState<PageId>("profile");

  function detail() {
    switch (page) {
      case "profile":
        return <EditProfile self={self} onUpdated={onUpdated} />;
      case "notifications":
        return <Notifications />;
      case "privacy":
        return <PrivacySecurity self={self} onUpdated={onUpdated} />;
      case "passkeys":
        return <Passkeys />;
      case "theme":
        return <ChatThemePage theme={theme} onSetTheme={onSetTheme} />;
      case "data":
        return <DataStorage />;
      case "language":
        return <Language />;
      case "qr":
        return <QrCode self={self} />;
      case "saved":
        return <SavedMessages />;
      case "encryption":
        return <EncryptionInfo />;
      case "report":
        return <ReportProblem />;
    }
  }

  return (
    <div className="settings">
      <div className="settings-menu">
        <button
          className="settings-profile-head"
          onClick={() => setPage("profile")}
          style={{ width: "100%", border: "none", background: "none" }}
        >
          <Avatar url={self.avatarUrl} name={self.displayName} />
          <div style={{ textAlign: "left" }}>
            <div className="settings-profile-name">{self.displayName}</div>
            <div className="settings-profile-user">@{self.username}</div>
          </div>
        </button>

        {MENU.map((m) => (
          <button
            key={m.id}
            className={`settings-row ${page === m.id ? "active" : ""}`}
            onClick={() => setPage(m.id)}
          >
            <span className="row-icon">
              <Icon name={m.icon} size={20} />
            </span>
            <span className="row-label">{m.label}</span>
          </button>
        ))}

        <button className="settings-row danger" onClick={onLogout}>
          <span className="row-icon">
            <Icon name="user_block" size={20} />
          </span>
          <span className="row-label">Log out</span>
        </button>
      </div>

      <div className="settings-detail">{detail()}</div>
    </div>
  );
}
