import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { loadTheme, applyTheme } from "./util/theme";
import "./styles.css";

// Apply the persisted theme before first paint to avoid a flash.
applyTheme(loadTheme());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
