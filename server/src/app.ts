import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";

import { env, getCorsOrigins } from "./config/env.js";
import { botControlRouter } from "./routes/botControlRoutes.js";
import { botProfileRouter } from "./routes/botProfileRoutes.js";
import { botRouter } from "./routes/botRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { controlRouter } from "./routes/controlRoutes.js";
import { identityRouter } from "./routes/identityRoutes.js";
import { logRouter } from "./routes/logRoutes.js";
import { payment2CallbackRouter } from "./routes/payment2CallbackRoutes.js";
import { payment2Proxy } from "./routes/payment2ProxyRoutes.js";
import { payment3CallbackRouter } from "./routes/payment3CallbackRoutes.js";
import { payment3Proxy } from "./routes/payment3ProxyRoutes.js";
import { payment4CallbackRouter } from "./routes/payment4CallbackRoutes.js";
import { payment4Proxy } from "./routes/payment4ProxyRoutes.js";
import { payment5CallbackRouter } from "./routes/payment5CallbackRoutes.js";
import { payment5Proxy } from "./routes/payment5ProxyRoutes.js";
import { paymentCallbackRouter } from "./routes/paymentCallbackRoutes.js";
import { paymentProxy } from "./routes/paymentProxyRoutes.js";
import { sessionRouter } from "./routes/sessionRoutes.js";

export function createApp() {
  const app = express();
  const webDistDir = path.join(env.projectRoot, "web", "dist");
  const hasBuiltWeb = fs.existsSync(webDistDir);

  app.use(
    cors({
      origin: getCorsOrigins(),
      credentials: false
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(env.uploadsDir));

  app.get("/health", (_req, res) => {
    res.json({
      message: "Telegram Admin backend is running."
    });
  });

  app.use(sessionRouter);
  app.use(identityRouter);
  app.use(controlRouter);
  app.use(botRouter);
  app.use(botProfileRouter);
  app.use(botControlRouter);
  app.use(logRouter);
  app.use(paymentCallbackRouter);
  app.use(payment2CallbackRouter);
  app.use(payment3CallbackRouter);
  app.use(payment4CallbackRouter);
  app.use(payment5CallbackRouter);
  app.use("/api/payment-proxy", paymentProxy);
  app.use("/api/payment2-proxy", payment2Proxy);
  app.use("/api/payment3-proxy", payment3Proxy);
  app.use("/api/payment4-proxy", payment4Proxy);
  app.use("/api/payment5-proxy", payment5Proxy);

  if (hasBuiltWeb) {
    app.use(express.static(webDistDir));

    app.get(/^\/(?!api|uploads|health).*/, (_req, res) => {
      res.sendFile(path.join(webDistDir, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}
