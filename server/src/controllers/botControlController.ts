import type { Request, Response } from "express";
import { z } from "zod";

import { botTelegramService } from "../services/telegram/BotTelegramService.js";

const botIdParamSchema = z.object({
  botId: z.coerce.number().int().positive()
});

const applyProfileSchema = z.object({
  botId: z.coerce.number().int().positive(),
  profileId: z.coerce.number().int().positive()
});

const sendGroupsSchema = z.object({
  botId: z.coerce.number().int().positive(),
  groupIds: z.array(z.string().trim().min(1, "groupIds 不能为空。")).min(1, "至少选择一个群组。"),
  message: z.string().trim().min(1, "message 不能为空。")
});

export async function listBotGroups(req: Request, res: Response) {
  const { botId } = botIdParamSchema.parse(req.params);
  const result = await botTelegramService.listGroups(botId);

  res.json({
    message: "Bot 群组列表获取成功。",
    data: result
  });
}

export async function getBotGroupDiagnostics(req: Request, res: Response) {
  const { botId } = botIdParamSchema.parse(req.params);
  const result = await botTelegramService.getGroupDiagnostics(botId);

  res.json({
    message: "Bot 群组诊断信息获取成功。",
    data: result
  });
}

export async function applyBotProfile(req: Request, res: Response) {
  const payload = applyProfileSchema.parse(req.body);
  const result = await botTelegramService.applyProfile(payload.botId, payload.profileId);

  res.json({
    message: "Bot 资料模板应用成功。",
    data: result
  });
}

export async function sendBotMessageToGroups(req: Request, res: Response) {
  const payload = sendGroupsSchema.parse(req.body);
  const result = await botTelegramService.sendMessageToGroups(payload.botId, payload.groupIds, payload.message);

  const message =
    result.failedCount > 0
      ? `已发送到 ${result.sentCount} 个群组，${result.failedCount} 个群组发送失败。`
      : `已发送到 ${result.sentCount} 个群组。`;

  res.json({
    message,
    data: result
  });
}
