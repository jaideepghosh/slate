import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/slate/" : "/",

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.ico",
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
      ],

      manifest: {
        id: "/",

        name: "Slate - Your Personal Workspace",
        short_name: "Slate",

        description:
          "Local-first note-taking workspace with offline support and direct local file system access.",

        start_url: "./",
        scope: "./",

        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],

        theme_color: "#1a1a2e",
        background_color: "#ffffff",

        categories: ["productivity"],

        icons: [
          {
            src: "slate-icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "slate-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "slate-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        navigateFallback: "index.html",

        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],

  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
