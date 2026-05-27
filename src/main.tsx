import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// v0.1.0 — Service worker for PWA offline app-shell (registered from index.html).
createRoot(document.getElementById("root")!).render(<App />);
