import { Router } from "express";

import {
  clearPayment10Callbacks,
  getPayment10Callbacks,
  handlePayment10Callback
} from "../controllers/payment10CallbackController.js";

export const payment10CallbackRouter = Router();

payment10CallbackRouter.post("/payment10/callback", handlePayment10Callback);
payment10CallbackRouter.post("/api/payment10/callback", handlePayment10Callback);
payment10CallbackRouter.get("/payment10/callbacks", getPayment10Callbacks);
payment10CallbackRouter.get("/api/payment10/callbacks", getPayment10Callbacks);
payment10CallbackRouter.delete("/payment10/callbacks", clearPayment10Callbacks);
payment10CallbackRouter.delete(
  "/api/payment10/callbacks",
  clearPayment10Callbacks
);
