import { Router } from "express";

import {
  clearPayment3Callbacks,
  getPayment3Callbacks,
  handlePayment3Callback
} from "../controllers/payment3CallbackController.js";

export const payment3CallbackRouter = Router();

payment3CallbackRouter.post("/payment3/callback", handlePayment3Callback);
payment3CallbackRouter.get("/payment3/callbacks", getPayment3Callbacks);
payment3CallbackRouter.delete("/payment3/callbacks", clearPayment3Callbacks);
