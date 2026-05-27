import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// `BASE_PATH` is set by the GitHub Pages workflow (e.g. "/productiveyou/") so
// the same source builds correctly for both Lovable (served at root) and the
// GitHub Pages mirror (served at /<repo>/). Vite injects this into
// `import.meta.env.BASE_URL` which React Router + the SW reg use to stay
// path-aware.
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
