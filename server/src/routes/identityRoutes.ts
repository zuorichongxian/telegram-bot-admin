import { Router } from "express";

import {
  createIdentity,
  deleteIdentity,
  getIdentity,
  listIdentities,
  updateIdentity
} from "../controllers/identityController.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const identityRouter = Router();

identityRouter.get("/identities", asyncHandler(listIdentities));
identityRouter.get("/identities/:id", asyncHandler(getIdentity));
identityRouter.post("/identities", upload.single("avatar"), asyncHandler(createIdentity));
identityRouter.put("/identities/:id", upload.single("avatar"), asyncHandler(updateIdentity));
identityRouter.delete("/identities/:id", asyncHandler(deleteIdentity));
