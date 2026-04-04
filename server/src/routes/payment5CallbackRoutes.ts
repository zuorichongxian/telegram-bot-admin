import { Router } from "express";

import {
  clearPayment5Callbacks,
  getPayment5Callbacks,
  handlePayment5Callback
} from "../controllers/payment5CallbackController.js";

export const payment5CallbackRouter = Router();

payment5CallbackRouter.post("/payment5/callback", handlePayment5Callback);
payment5CallbackRouter.get("/payment5/callbacks", getPayment5Callbacks);
payment5CallbackRouter.delete("/payment5/callbacks", clearPayment5Callbacks);
