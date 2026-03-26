import { Router } from "express";

import { createBot, deleteBot, listBots } from "../controllers/botController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const botRouter = Router();

botRouter.get("/bots", asyncHandler(listBots));
botRouter.post("/bots", asyncHandler(createBot));
botRouter.delete("/bots/:id", asyncHandler(deleteBot));
