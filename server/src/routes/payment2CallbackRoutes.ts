import { Router } from "express";

import {
  clearPayment2Callbacks,
  getPayment2Callbacks,
  handlePayment2Callback
} from "../controllers/payment2CallbackController.js";

export const payment2CallbackRouter = Router();

payment2CallbackRouter.post("/payment2/callback", handlePayment2Callback);
payment2CallbackRouter.get("/payment2/callbacks", getPayment2Callbacks);
payment2CallbackRouter.delete("/payment2/callbacks", clearPayment2Callbacks);
