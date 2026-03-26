type ErrorShape = {
  message?: string;
  errorMessage?: string;
};

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as ErrorShape;
    if (typeof maybeError.errorMessage === "string" && maybeError.errorMessage) {
      return maybeError.errorMessage;
    }
    if (typeof maybeError.message === "string" && maybeError.message) {
      return maybeError.message;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

export function mapTelegramError(error: unknown, fallbackMessage: string): AppError {
  const message = getErrorMessage(error);

  if (message.includes("PHONE_NUMBER_INVALID")) {
    return new AppError(400, "手机号格式无效，请检查后重新输入。");
  }

  if (message.includes("PHONE_CODE_INVALID")) {
    return new AppError(400, "验证码不正确，请重新输入。");
  }

  if (message.includes("PHONE_CODE_EXPIRED")) {
    return new AppError(400, "验证码已过期，请重新获取验证码。");
  }

  if (message.includes("SESSION_PASSWORD_NEEDED")) {
    return new AppError(400, "该账号启用了二步验证，请继续输入 password。", {
      code: "PASSWORD_REQUIRED"
    });
  }

  if (message.includes("PASSWORD_HASH_INVALID")) {
    return new AppError(400, "二步验证密码错误，请重新输入。");
  }

  if (message.includes("AUTH_KEY_UNREGISTERED") || message.includes("SESSION_REVOKED")) {
    return new AppError(401, "Telegram 会话已失效，请重新登录。");
  }

  if (message.includes("PEER_ID_INVALID") || message.includes("USERNAME_INVALID")) {
    return new AppError(400, "目标聊天无效，请输入正确的用户名、ID 或可访问的对话对象。");
  }

  if (message.includes("FLOOD_WAIT")) {
    return new AppError(429, "请求过于频繁，Telegram 临时限制了当前操作，请稍后再试。");
  }

  if (message.includes("PHOTO_EXT_INVALID") || message.includes("IMAGE_PROCESS_FAILED")) {
    return new AppError(400, "头像图片无效，请上传常见图片格式并确保文件内容正常。");
  }

  if (message.includes("ACCESS_TOKEN_INVALID") || message.includes("BOT_INVALID")) {
    return new AppError(400, "Bot Token 无效，请检查后重新输入。");
  }

  if (message.includes("USER_BOT_INVALID")) {
    return new AppError(400, "当前 Bot 资料更新请求无效，请重新接入 Bot 后再试。");
  }

  return new AppError(500, `${fallbackMessage} ${message}`.trim());
}
