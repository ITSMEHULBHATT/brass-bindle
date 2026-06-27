import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Standalone SPA build used to package the app into a Capacitor APK.
// Lovable's normal `vite build` produces an SSR bundle (TanStack Start) which
// can't be loaded from the Android filesystem — this config produces a pure
// static SPA in dist-mobile/ that Capacitor can wrap.
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  root: path.resolve(__dirname, "src/mobile"),
  build: {
    outDir: path.resolve(__dirname, "dist-mobile"),
    emptyOutDir: true,
    target: "es2020",
  },
});
