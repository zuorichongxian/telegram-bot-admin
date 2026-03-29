import { createProxyMiddleware } from "http-proxy-middleware";

export const paymentProxy = createProxyMiddleware({
  target: "https://pay.fykkbb.xyz",
  changeOrigin: true,
  pathRewrite: (path) => `/order/api/v1${path}`,
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.removeHeader("origin");
      proxyReq.removeHeader("referer");
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

        console.log("[payment-proxy] response", {
          method: req.method,
          path: req.url,
          statusCode: proxyRes.statusCode,
          contentType,
          body: isTruncated ? `${bodyPreview}\n...<truncated>` : bodyPreview
        });
      });
    }
  }
});
