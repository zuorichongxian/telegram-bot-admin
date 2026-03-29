import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router = Router();

// 支付 API 代理配置
const paymentProxy = createProxyMiddleware({
  target: "https://pay.fykkbb.xyz",
  changeOrigin: true,
  pathRewrite: {
    "^/api/payment-proxy": "/order/api/v1"
  },
  on: {
    proxyReq: (proxyReq, _req, _res) => {
      proxyReq.removeHeader("origin");
      proxyReq.removeHeader("referer");
    },
    proxyRes: (proxyRes, _req, _res) => {
      proxyRes.headers["access-control-allow-origin"] = undefined;
      proxyRes.headers["access-control-allow-credentials"] = undefined;
      proxyRes.headers["access-control-allow-methods"] = undefined;
      proxyRes.headers["access-control-allow-headers"] = undefined;
    }
  }
});

// 使用通配符匹配所有 payment-proxy 路径
router.all("/payment-proxy/*", paymentProxy);

export const paymentProxyRouter = router;
