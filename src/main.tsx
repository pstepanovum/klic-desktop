import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { loadTheme, applyTheme } from "./util/theme";
import {
  loadBubbleColor,
  applyBubbleColor,
  loadPattern,
  applyPattern,
} from "./util/chatTheme";
import "./styles.css";

// Apply persisted theme, bubble color, and chat pattern before first paint.
applyTheme(loadTheme());
applyBubbleColor(loadBubbleColor());
applyPattern(loadPattern());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
