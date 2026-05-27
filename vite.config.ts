import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// `BASE_PATH` lets the build target a non-root subpath if we ever ship the
// app under one (e.g. "/app/" behind a reverse proxy). Default is root,
// which is what Lovable serves. Vite injects this into
// `import.meta.env.BASE_URL` so React Router and the SW stay path-aware.
const basePath = process.env.BASE_PATH || "/";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: basePath,
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
