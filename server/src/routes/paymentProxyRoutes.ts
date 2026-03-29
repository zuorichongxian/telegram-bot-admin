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
    proxyRes: (proxyRes) => {
      proxyRes.headers["access-control-allow-origin"] = undefined;
      proxyRes.headers["access-control-allow-credentials"] = undefined;
      proxyRes.headers["access-control-allow-methods"] = undefined;
      proxyRes.headers["access-control-allow-headers"] = undefined;
    }
  }
});
