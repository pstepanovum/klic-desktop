// Light/dark theme with persistence. "system" follows the OS preference.
export type Theme = "light" | "dark" | "system";

const KEY = "klic.theme";

export function loadTheme(): Theme {
  const v = localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  localStorage.setItem(KEY, theme);
}

// Cycle light -> dark -> system for the header toggle.
export function nextTheme(theme: Theme): Theme {
  if (theme === "light") return "dark";
  if (theme === "dark") return "system";
  return "light";
}

export function themeIcon(theme: Theme): string {
  if (theme === "light") return "☀"; // sun
  if (theme === "dark") return "☽"; // moon
  return "◐"; // half circle = system
}
