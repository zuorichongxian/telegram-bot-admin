import { Router } from "express";

import {
  clearPayment9Callbacks,
  getPayment9Callbacks,
  handlePayment9Callback
} from "../controllers/payment9CallbackController.js";

export const payment9CallbackRouter = Router();

payment9CallbackRouter.post("/payment9/callback", handlePayment9Callback);
payment9CallbackRouter.get("/payment9/callbacks", getPayment9Callbacks);
payment9CallbackRouter.delete("/payment9/callbacks", clearPayment9Callbacks);
