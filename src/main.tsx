import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { loadTheme, applyTheme } from "./util/theme";
import { loadBubbleColor, applyBubbleColor } from "./util/chatTheme";
import "./styles.css";

// Apply persisted theme + bubble color before first paint to avoid a flash.
applyTheme(loadTheme());
applyBubbleColor(loadBubbleColor());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
