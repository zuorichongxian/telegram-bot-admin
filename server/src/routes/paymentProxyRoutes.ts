import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

export const paymentProxyRouter = Router();

// 支付 API 代理配置
const paymentProxy = createProxyMiddleware({
  target: "https://pay.fykkbb.xyz",
  changeOrigin: true,
  pathRewrite: {
    "^/api/payment-proxy": "/order/api/v1"
  },
  on: {
    proxyReq: (proxyReq, _req, _res) => {
      // 删除可能导致问题的请求头
      proxyReq.removeHeader("origin");
      proxyReq.removeHeader("referer");
    },
    proxyRes: (proxyRes, _req, res) => {
      // 删除支付服务器返回的 CORS 头，避免重复
      proxyRes.headers["access-control-allow-origin"] = undefined;
      proxyRes.headers["access-control-allow-credentials"] = undefined;
      proxyRes.headers["access-control-allow-methods"] = undefined;
      proxyRes.headers["access-control-allow-headers"] = undefined;
    }
  }
});

// 代收下单 - 使用 all 方法处理所有 HTTP 方法
paymentProxyRouter.all("/payment-proxy/collectOrder/create", paymentProxy);

// 代收订单查询
paymentProxyRouter.all("/payment-proxy/collectOrder/queryCollectOrder", paymentProxy);

// 代付下单
paymentProxyRouter.all("/payment-proxy/paymentOrder/create", paymentProxy);

// 代付订单查询
paymentProxyRouter.all("/payment-proxy/paymentOrder/queryPaymentOrder", paymentProxy);

// 商户信息查询
paymentProxyRouter.all("/payment-proxy/merchant", paymentProxy);
