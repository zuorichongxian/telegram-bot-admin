import { AppError } from "./errors.js";

export function splitDisplayName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");

  if (!normalized) {
    throw new AppError(400, "身份名称不能为空。");
  }

  const [firstName, ...rest] = normalized.split(" ");

  if (!firstName) {
    throw new AppError(400, "身份名称不能为空。");
  }

  return {
    firstName,
    lastName: rest.join(" ") || undefined
  };
}
