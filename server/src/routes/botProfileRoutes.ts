import { Router } from "express";

import {
  createBotProfile,
  deleteBotProfile,
  listBotProfiles,
  updateBotProfile
} from "../controllers/botProfileController.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const botProfileRouter = Router();

botProfileRouter.get("/bot-profiles", asyncHandler(listBotProfiles));
botProfileRouter.post("/bot-profiles", upload.single("avatar"), asyncHandler(createBotProfile));
botProfileRouter.put("/bot-profiles/:id", upload.single("avatar"), asyncHandler(updateBotProfile));
botProfileRouter.delete("/bot-profiles/:id", asyncHandler(deleteBotProfile));
