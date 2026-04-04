import { Router } from "express";

import {
  clearPayment8Callbacks,
  getPayment8Callbacks,
  handlePayment8Callback
} from "../controllers/payment8CallbackController.js";

export const payment8CallbackRouter = Router();

payment8CallbackRouter.post("/payment8/callback", handlePayment8Callback);
payment8CallbackRouter.get("/payment8/callbacks", getPayment8Callbacks);
payment8CallbackRouter.delete("/payment8/callbacks", clearPayment8Callbacks);
