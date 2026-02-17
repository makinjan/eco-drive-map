import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Cache Google Maps tiles for offline use in tunnels/poor coverage
            urlPattern: /^https:\/\/maps\.googleapis\.com\/maps\/vt/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-maps-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache Google Maps JS API and static resources
            urlPattern: /^https:\/\/maps\.googleapis\.com\/maps\/api/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-maps-api",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache Google Maps static assets (fonts, icons, sprites)
            urlPattern: /^https:\/\/maps\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-maps-static",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache Directions API responses (routes) for brief offline periods
            urlPattern: /^https:\/\/maps\.googleapis\.com\/maps\/api\/directions/,
            handler: "NetworkFirst",
            options: {
              cacheName: "google-directions-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Cache Geocoding & Places API
            urlPattern: /^https:\/\/maps\.googleapis\.com\/maps\/api\/(geocode|place)/,
            handler: "NetworkFirst",
            options: {
              cacheName: "google-places-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      manifest: {
        name: "ZBE Navigator — Rutas legales",
        short_name: "ZBE Nav",
        description: "Calcula rutas que respeten las Zonas de Bajas Emisiones según tu etiqueta DGT",
        theme_color: "#6d28d9",
        background_color: "#0f1117",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
