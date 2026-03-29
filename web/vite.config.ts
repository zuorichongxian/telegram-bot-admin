import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api/payment-proxy": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/api/payment": {
        target: "https://pay.fykkbb.xyz",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/payment/, "/order/api/v1"),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
          });

          proxy.on("proxyRes", (proxyRes, req) => {
            const chunks: Buffer[] = [];
            let totalLength = 0;
            const maxLogLength = 200 * 1024;

            proxyRes.on("data", (chunk: Buffer) => {
              if (totalLength >= maxLogLength) {
                return;
              }

              const remaining = maxLogLength - totalLength;
              if (chunk.length <= remaining) {
                chunks.push(chunk);
                totalLength += chunk.length;
                return;
              }

              chunks.push(chunk.subarray(0, remaining));
              totalLength += remaining;
            });

            proxyRes.on("end", () => {
              const bodyPreview = Buffer.concat(chunks).toString("utf8");
              const isTruncated = Number(proxyRes.headers["content-length"] ?? 0) > totalLength;
              const contentType = proxyRes.headers["content-type"] ?? "unknown";

              console.log("[vite-payment-proxy] response", {
                method: req.method,
                path: req.url,
                statusCode: proxyRes.statusCode,
                contentType,
                body: isTruncated ? `${bodyPreview}\n...<truncated>` : bodyPreview
              });
            });
          });
        }
      }
    }
  }
});
