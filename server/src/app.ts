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
import { paymentCallbackRouter } from "./routes/paymentCallbackRoutes.js";
import { paymentProxy, paymentProxyRouter } from "./routes/paymentProxyRoutes.js";
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
  app.use("/api/payment-proxy", paymentProxy);

  if (hasBuiltWeb) {
    app.use(express.static(webDistDir));

    app.get(/^\/(?!api|uploads|health).*/, (_req, res) => {
      res.sendFile(path.join(webDistDir, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}
