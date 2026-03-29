import { Router } from "express";

import {
  handlePaymentCallback,
  getPaymentCallbacks,
  clearPaymentCallbacks
} from "../controllers/paymentCallbackController.js";

export const paymentCallbackRouter = Router();

paymentCallbackRouter.post("/payment/callback", handlePaymentCallback);
paymentCallbackRouter.get("/payment/callbacks", getPaymentCallbacks);
paymentCallbackRouter.delete("/payment/callbacks", clearPaymentCallbacks);
