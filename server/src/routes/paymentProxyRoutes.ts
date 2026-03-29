import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router = Router();

const paymentProxy = createProxyMiddleware({
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

router.all("/payment-proxy/*path", paymentProxy);

export const paymentProxyRouter = router;
