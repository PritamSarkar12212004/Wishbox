import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    // Keep the port fixed so the ngrok tunnel script always targets the right port.
    port: 5173,
    strictPort: true,
    // Vite blocks requests whose Host header doesn't match the local server.
    // ngrok rewrites the Host header to the public domain, so it must be allowed.
    allowedHosts: ["numerate-resisting-squeamish.ngrok-free.dev"],
  },
});