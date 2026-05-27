import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register the PWA service worker (offline app-shell + install prompt).
// BASE_URL is "/" on Lovable, "/productiveyou/" on the GitHub Pages mirror;
// Vite injects it at build time so the SW is found in both deployments.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  const base = import.meta.env.BASE_URL || "/";
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch((err) => console.warn("[pwa] sw registration failed:", err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
