import { Router } from "express";

import {
  sendMessage,
  switchAndSend,
  switchIdentity
} from "../controllers/controlController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const controlRouter = Router();

controlRouter.post("/control/switch", asyncHandler(switchIdentity));
controlRouter.post("/control/send", asyncHandler(sendMessage));
controlRouter.post("/control/switch-and-send", asyncHandler(switchAndSend));
