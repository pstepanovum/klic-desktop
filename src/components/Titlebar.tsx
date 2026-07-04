import type { ReactNode } from "react";
import { Icon, type AnyIconName } from "../icons/Icon";
import type { Theme } from "../util/theme";

interface Props {
  variant?: "app" | "auth";
  right?: ReactNode;
  search?: string;
  onSearch?: (v: string) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
}

const themeIcon = (t: Theme): AnyIconName =>
  t === "dark" ? "moon" : t === "light" ? "appearance" : "theme";

// Custom titlebar used with macOS `titleBarStyle: Overlay` — the native title
// text is hidden. The bar is a drag region; native window controls (traffic
// lights) float in the reserved left inset. A theme toggle sits just right of
// the traffic lights and a rounded search field is centered.
export function Titlebar({
  variant = "app",
  right,
  search,
  onSearch,
  theme,
  onToggleTheme,
}: Props) {
  return (
    <div className={`titlebar tb-${variant}`} data-tauri-drag-region>
      {variant === "app" && onSearch && (
        <div className="titlebar-search">
          <Icon name="search" size={16} />
          <input
            value={search ?? ""}
            placeholder="Search"
            spellCheck={false}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
      <div className="titlebar-spacer" data-tauri-drag-region />
      <div className="titlebar-right">
        {right}
        {variant === "app" && onToggleTheme && theme && (
          <button
            className="titlebar-theme"
            onClick={onToggleTheme}
            title="Toggle theme"
          >
            <Icon name={themeIcon(theme)} size={19} />
          </button>
        )}
      </div>
    </div>
  );
}
