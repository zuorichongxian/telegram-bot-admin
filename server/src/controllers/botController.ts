import type { Request, Response } from "express";
import { z } from "zod";

import { botService } from "../services/BotService.js";
import { botTelegramService } from "../services/telegram/BotTelegramService.js";

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const createBotSchema = z.object({
  token: z.string().trim().min(1, "token 不能为空。")
});

export async function listBots(_req: Request, res: Response) {
  res.json({
    message: "Bot 列表获取成功。",
    data: botService.list()
  });
}

export async function createBot(req: Request, res: Response) {
  const payload = createBotSchema.parse(req.body);
  const bot = await botTelegramService.createBotAccount(payload.token);

  res.status(201).json({
    message: "Bot 接入成功。",
    data: bot
  });
}

export async function deleteBot(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await botTelegramService.deleteBot(id);

  res.json({
    message: "Bot 删除成功。"
  });
}
