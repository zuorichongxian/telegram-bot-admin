import { Router } from "express";

import { listLogs } from "../controllers/logController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const logRouter = Router();

logRouter.get("/logs", asyncHandler(listLogs));
