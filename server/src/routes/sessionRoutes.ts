import { Router } from "express";

import { login, logout, status } from "../controllers/sessionController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const sessionRouter = Router();

sessionRouter.post("/session/login", asyncHandler(login));
sessionRouter.post("/session/logout", asyncHandler(logout));
sessionRouter.get("/session/status", asyncHandler(status));
