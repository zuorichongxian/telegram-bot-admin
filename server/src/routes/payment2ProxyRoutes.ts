import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

export const payment2Proxy = createProxyMiddleware({
  target: "https://jkapi-shengxing.jkcbb.com",
  changeOrigin: true,
  proxyTimeout: 15000,
  timeout: 20000,
  pathRewrite: (path) => `/api/v1${path}`,
  on: {
    proxyReq: (proxyReq, req) => {
      if (!proxyReq.headersSent) {
        proxyReq.removeHeader("origin");
        proxyReq.removeHeader("referer");
      }
      fixRequestBody(proxyReq, req);
    },
    proxyRes: (proxyRes, req) => {
      proxyRes.headers["access-control-allow-origin"] = undefined;
      proxyRes.headers["access-control-allow-credentials"] = undefined;
      proxyRes.headers["access-control-allow-methods"] = undefined;
      proxyRes.headers["access-control-allow-headers"] = undefined;

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

        console.log("[payment2-proxy] response", {
          method: req.method,
          path: req.url,
          statusCode: proxyRes.statusCode,
          contentType,
          body: isTruncated ? `${bodyPreview}\n...<truncated>` : bodyPreview
        });
      });
    },
    error: (err, req, res) => {
      console.error("[payment2-proxy] error", {
        method: req.method,
        path: req.url,
        message: err.message
      });

      const response = res as { writableEnded?: boolean; writeHead: (code: number, headers: Record<string, string>) => void; end: (body: string) => void };
      if (!response.writableEnded) {
        response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
        response.end(
          JSON.stringify({
            code: "PROXY_ERROR",
            message: "支付代理请求失败",
            detail: err.message
          })
        );
      }
    }
  }
});
