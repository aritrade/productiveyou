import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register the PWA service worker (offline app-shell + install prompt).
// Uses Vite's BASE_URL so the SW path stays correct if we ever serve under
// a non-root subpath. Production only — skip in dev to avoid stale caches.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  const base = import.meta.env.BASE_URL || "/";
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch((err) => console.warn("[pwa] sw registration failed:", err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
