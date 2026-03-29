import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

export const paymentProxy = createProxyMiddleware({
  target: "https://pay.fykkbb.xyz",
  changeOrigin: true,
  pathRewrite: {
    "^/api/payment-proxy": "/order/api/v1"
  },
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

// 创建空路由器，实际代理在 app.ts 中配置
export const paymentProxyRouter = Router();
