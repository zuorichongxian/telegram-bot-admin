import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";

import { AppError } from "../utils/errors.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "请求参数不正确。",
      details: error.flatten().fieldErrors
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({
      message: `文件上传失败：${error.message}`
    });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({
      message: "请求体不是合法的 JSON。"
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    message: "服务器内部错误，请查看后端日志。"
  });
}
