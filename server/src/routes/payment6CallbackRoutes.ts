import { Router } from "express";

import {
  clearPayment6Callbacks,
  getPayment6Callbacks,
  handlePayment6Callback
} from "../controllers/payment6CallbackController.js";

export const payment6CallbackRouter = Router();

payment6CallbackRouter.post("/payment6/callback", handlePayment6Callback);
payment6CallbackRouter.get("/payment6/callbacks", getPayment6Callbacks);
payment6CallbackRouter.delete("/payment6/callbacks", clearPayment6Callbacks);
