import type { Request, Response } from "express";
import { z } from "zod";

import { identityService } from "../services/IdentityService.js";
import { telegramService } from "../services/telegram/TelegramService.js";

const switchSchema = z.object({
  identityId: z.coerce.number().int().positive()
});

const sendSchema = z.object({
  target: z.string().trim().min(1, "target 不能为空。"),
  message: z.string().trim().min(1, "message 不能为空。")
});

const switchAndSendSchema = z.object({
  identityId: z.coerce.number().int().positive(),
  target: z.string().trim().min(1, "target 不能为空。"),
  message: z.string().trim().optional().default("")
});

export async function switchIdentity(req: Request, res: Response) {
  const payload = switchSchema.parse(req.body);
  const identity = identityService.getById(payload.identityId);
  const result = await telegramService.switchIdentity(identity);

  res.json({
    message: "身份切换成功。",
    data: result
  });
}

export async function sendMessage(req: Request, res: Response) {
  const payload = sendSchema.parse(req.body);
  const result = await telegramService.sendMessage(payload.target, payload.message);

  res.json({
    message: "消息发送成功。",
    data: result
  });
}

export async function switchAndSend(req: Request, res: Response) {
  const payload = switchAndSendSchema.parse(req.body);
  const identity = identityService.getById(payload.identityId);
  const result = await telegramService.switchAndSend(identity, payload.target, payload.message);

  res.json({
    message: "切换身份并发送消息成功。",
    data: result
  });
}
