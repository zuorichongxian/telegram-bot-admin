import fs from "node:fs";

import type { Request, Response } from "express";
import { z } from "zod";

import { identityService } from "../services/IdentityService.js";

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const identityBodySchema = z.object({
  name: z.string().trim().min(1, "name 不能为空。"),
  messageTemplate: z.string().trim().default("")
});

function cleanupUploadedFile(file?: Express.Multer.File) {
  if (file && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
}

export async function listIdentities(_req: Request, res: Response) {
  res.json({
    message: "身份列表获取成功。",
    data: identityService.list()
  });
}

export async function getIdentity(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  res.json({
    message: "身份详情获取成功。",
    data: identityService.getById(id)
  });
}

export async function createIdentity(req: Request, res: Response) {
  const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const payload = identityBodySchema.parse(req.body);
    const identity = identityService.create({
      name: payload.name,
      avatarPath,
      messageTemplate: payload.messageTemplate
    });

    res.status(201).json({
      message: "身份创建成功。",
      data: identity
    });
  } catch (error) {
    cleanupUploadedFile(req.file);
    throw error;
  }
}

export async function updateIdentity(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const avatarPath = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const payload = identityBodySchema.parse(req.body);
    const identity = identityService.update(id, {
      name: payload.name,
      avatarPath,
      messageTemplate: payload.messageTemplate,
      removeAvatar: req.body.removeAvatar === "true"
    });

    res.json({
      message: "身份更新成功。",
      data: identity
    });
  } catch (error) {
    cleanupUploadedFile(req.file);
    throw error;
  }
}

export async function deleteIdentity(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  identityService.delete(id);

  res.json({
    message: "身份删除成功。"
  });
}
