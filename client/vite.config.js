import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4 plugin
  ],
  server: {
    port: 5173, // Frontend runs here
    proxy: {
      "/api": "http://localhost:4000", // Express API (backend)
      "/socket.io": { target: "http://localhost:4000", ws: true }, // WebSocket proxy
      "/public": "http://localhost:4000", // serve PDFs, posters, etc.
    },
  },
});
