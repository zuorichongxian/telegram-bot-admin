import type { Request, Response } from "express";
import { z } from "zod";

import { operationLogService } from "../services/OperationLogService.js";

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional()
});

export async function listLogs(req: Request, res: Response) {
  const query = querySchema.parse(req.query);

  res.json({
    message: "操作日志获取成功。",
    data: operationLogService.list(query.limit)
  });
}
