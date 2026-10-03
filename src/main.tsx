import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import { loadTheme, applyTheme } from "./util/theme";
import {
  loadBubbleColor,
  applyBubbleColor,
  loadPattern,
  applyPattern,
} from "./util/chat-theme";
// Global styles, split by area. Keep this order: it is the cascade order.
import "./styles/base.css";
import "./styles/shell-titlebar.css";
import "./styles/auth.css";
import "./styles/app-shell.css";
import "./styles/nav-rail.css";
import "./styles/settings.css";
import "./styles/chat-pane.css";
import "./styles/composer.css";
import "./styles/calls.css";
import "./styles/screen-share-picker.css";
import "./styles/misc.css";

// Apply persisted theme, bubble color, and chat pattern before first paint.
applyTheme(loadTheme());
applyBubbleColor(loadBubbleColor());
applyPattern(loadPattern());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
