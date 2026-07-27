import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// Standalone SPA build used to package the app into a Capacitor APK OR host on
// GitHub Pages. Set VITE_BASE (e.g. "/repo-name/") for GitHub Pages subpaths.
const base = process.env.VITE_BASE || "/brass-bindle/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      strategies: "generateSW",
      filename: "sw.js",
      devOptions: { enabled: false },
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "icons/icon-512-maskable.png"],
      manifestFilename: "manifest.webmanifest",
      manifest: {
        name: "Superior Bath Fittings",
        short_name: "SBF Orders",
        description: "Production tracker for Superior Bath Fittings",
        theme_color: "#1A2B4A",
        background_color: "#ffffff",
        display: "standalone",
        start_url: base,
        scope: base,
        id: base,
        icons: [
          {
            src: `${base}icons/icon-192.png`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${base}icons/icon-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${base}icons/icon-512-maskable.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false, // wait for user prompt
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // NetworkFirst for HTML navigations so users get fresh app shell.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "sbf-html",
              networkTimeoutSeconds: 4,
            },
          },
          {
            // CacheFirst for hashed static assets.
            urlPattern: ({ request }) =>
              ["script", "style", "font", "image"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "sbf-assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
        ],
      },
    }),
  ],
  root: path.resolve(__dirname, "src/mobile"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    target: "es2020",
  },
});
