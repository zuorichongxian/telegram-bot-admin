import { Router } from "express";

import {
  applyBotProfile,
  getBotGroupDiagnostics,
  listBotGroups,
  sendBotMessageToGroups
} from "../controllers/botControlController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const botControlRouter = Router();

botControlRouter.get("/bot-control/groups/:botId", asyncHandler(listBotGroups));
botControlRouter.get("/bot-control/diagnostics/:botId", asyncHandler(getBotGroupDiagnostics));
botControlRouter.post("/bot-control/apply-profile", asyncHandler(applyBotProfile));
botControlRouter.post("/bot-control/send-groups", asyncHandler(sendBotMessageToGroups));
