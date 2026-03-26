import fs from "node:fs";

import type { Request, Response } from "express";
import { z } from "zod";

import { botProfileService } from "../services/BotProfileService.js";

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const botProfileBodySchema = z.object({
  name: z.string().trim().min(1, "name 不能为空。")
});

function cleanupUploadedFile(file?: Express.Multer.File) {
  if (file && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
}

export async function listBotProfiles(_req: Request, res: Response) {
  res.json({
    message: "Bot 资料模板列表获取成功。",
    data: botProfileService.list()
  });
}

export async function createBotProfile(req: Request, res: Response) {
  const avatarPath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const payload = botProfileBodySchema.parse(req.body);
    const profile = botProfileService.create({
      name: payload.name,
      avatarPath
    });

    res.status(201).json({
      message: "Bot 资料模板创建成功。",
      data: profile
    });
  } catch (error) {
    cleanupUploadedFile(req.file);
    throw error;
  }
}

export async function updateBotProfile(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const avatarPath = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const payload = botProfileBodySchema.parse(req.body);
    const profile = botProfileService.update(id, {
      name: payload.name,
      avatarPath,
      removeAvatar: req.body.removeAvatar === "true"
    });

    res.json({
      message: "Bot 资料模板更新成功。",
      data: profile
    });
  } catch (error) {
    cleanupUploadedFile(req.file);
    throw error;
  }
}

export async function deleteBotProfile(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  botProfileService.delete(id);

  res.json({
    message: "Bot 资料模板删除成功。"
  });
}
