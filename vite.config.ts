import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The site is hosted at https://<username>.github.io/attendance/
// so the base path must be "/attendance/".
const GH_PAGES_BASE = "/attendance/";

export default defineConfig({
  base: GH_PAGES_BASE,
  plugins: [react()],
  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ["recharts"],
          react: ["react", "react-dom", "react-router-dom"],
          lucide: ["lucide-react"],
        },
      },
    },
  },
});