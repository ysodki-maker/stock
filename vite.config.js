import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy pour les images WordPress — contourne le blocage CORS
      "/wp-images": {
        target: "https://stockbackup.cosinus.ma",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/wp-images/, "/wp-content/uploads"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Supprimer les headers qui pourraient poser problème
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
          });
          proxy.on("proxyRes", (proxyRes) => {
            // Forcer les headers CORS dans la réponse
            proxyRes.headers["access-control-allow-origin"] = "*";
            proxyRes.headers["cross-origin-resource-policy"] = "cross-origin";
          });
        },
      },
    },
  },
});
