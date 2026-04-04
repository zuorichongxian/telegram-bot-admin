import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import type { Request } from "express";

import {
  DEFAULT_PAYMENT3_MERCHANT_KEY,
  generatePayment3OrderSign,
  generatePayment3QuerySign
} from "../utils/payment3Sign.js";

function stringify(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

function rewritePayment3Sign(req: Request) {
  const body = req.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") {
    return;
  }

  if (req.path.endsWith("/pay/open/order")) {
    const account = stringify(body.account);
    const product = stringify(body.product);
    const orderId = stringify(body.orderId);
    const price = stringify(body.price);
    const notifyUrl = stringify(body.notifyUrl);
    const time = stringify(body.time);

    if (account && product && orderId && price && notifyUrl && time) {
      body.sign = generatePayment3OrderSign(
        {
          account,
          product,
          orderId,
          price,
          notifyUrl,
          time
        },
        DEFAULT_PAYMENT3_MERCHANT_KEY
      );
    }
    return;
  }

  if (req.path.endsWith("/pay/open/query")) {
    const account = stringify(body.account);
    const orderId = stringify(body.orderId);

    if (account && orderId) {
      body.sign = generatePayment3QuerySign(
        {
          account,
          orderId
        },
        DEFAULT_PAYMENT3_MERCHANT_KEY
      );
    }
  }
}

export const payment3Proxy = createProxyMiddleware({
  target: "http://47.57.185.38",
  changeOrigin: true,
  proxyTimeout: 15000,
  timeout: 20000,
  pathRewrite: (path) => `/openapi${path}`,
  on: {
    proxyReq: (proxyReq, req) => {
      rewritePayment3Sign(req as Request);
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

        console.log("[payment3-proxy] response", {
          method: req.method,
          path: req.url,
          statusCode: proxyRes.statusCode,
          contentType,
          body: isTruncated ? `${bodyPreview}\n...<truncated>` : bodyPreview
        });
      });
    },
    error: (err, req, res) => {
      console.error("[payment3-proxy] error", {
        method: req.method,
        path: req.url,
        message: err.message
      });

      const response = res as {
        writableEnded?: boolean;
        writeHead: (code: number, headers: Record<string, string>) => void;
        end: (body: string) => void;
      };

      if (!response.writableEnded) {
        response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
        response.end(
          JSON.stringify({
            code: "PROXY_ERROR",
            message: "支付3代理请求失败",
            detail: err.message
          })
        );
      }
    }
  }
});
