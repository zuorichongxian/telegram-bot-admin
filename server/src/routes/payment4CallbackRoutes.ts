import { Router } from "express";

import {
  clearPayment4Callbacks,
  getPayment4Callbacks,
  handlePayment4Callback
} from "../controllers/payment4CallbackController.js";

export const payment4CallbackRouter = Router();

payment4CallbackRouter.post("/payment4/callback", handlePayment4Callback);
payment4CallbackRouter.get("/payment4/callbacks", getPayment4Callbacks);
payment4CallbackRouter.delete("/payment4/callbacks", clearPayment4Callbacks);
