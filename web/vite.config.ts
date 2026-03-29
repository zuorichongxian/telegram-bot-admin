import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api/payment': {
        target: 'https://pay.fykkbb.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/payment/, '/order/api/v1'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // 删除可能导致问题的请求头
            proxyReq.removeHeader('origin');
          });
        }
      }
    }
  }
});
