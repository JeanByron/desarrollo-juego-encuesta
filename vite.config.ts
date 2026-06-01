import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        // Separamos las librerías base en archivos propios. Como casi nunca
        // cambian, el navegador del estudiante las guarda en caché y, cuando
        // publicas una nueva versión del juego, solo vuelve a bajar el código
        // de la app (pequeño), no las librerías. Menos ancho de banda repetido.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"]
        }
      }
    }
  }
});
