import type { Request, Response } from "express";
import { z } from "zod";

import { telegramService } from "../services/telegram/TelegramService.js";

const loginSchema = z.object({
  phoneNumber: z.string().trim().min(5, "phoneNumber 不能为空。"),
  phoneCode: z.string().trim().optional(),
  password: z.string().trim().optional()
});

export async function login(req: Request, res: Response) {
  const payload = loginSchema.parse(req.body);
  const result = await telegramService.login(payload);

  res.json({
    message: result.message,
    data: result
  });
}

export async function status(_req: Request, res: Response) {
  const result = await telegramService.getStatus();

  res.json({
    message: "会话状态获取成功。",
    data: result
  });
}

export async function logout(_req: Request, res: Response) {
  const result = await telegramService.logout();

  res.json({
    message: "当前 Telegram 账号已退出。",
    data: result
  });
}
