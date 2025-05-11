import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://backend:3000", // Utilisation du nom du service Docker
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      },
      "/predict": {
        target: "http://localhost:3000",
        changeOrigin: true,
      }
    },
    host: true, // Écoute sur toutes les interfaces
    port: 5173
  }
});