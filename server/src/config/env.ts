import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { z } from "zod";

const currentFilePath = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(currentFilePath), "../..");
const projectRoot = path.resolve(serverRoot, "..");

const envCandidates = [
  path.join(projectRoot, ".env"),
  path.join(serverRoot, ".env")
];

const existingEnvPath = envCandidates.find((candidate) => fs.existsSync(candidate));

if (existingEnvPath) {
  dotenv.config({ path: existingEnvPath });
}

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  TELEGRAM_APP_ID: z.coerce.number().int().positive(),
  TELEGRAM_APP_HASH: z.string().min(1),
  LOG_LIMIT: z.coerce.number().int().positive().default(50),
  DATABASE_FILE: z.string().trim().min(1).optional(),
  UPLOADS_DIR: z.string().trim().min(1).optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment variables are invalid.");
}

export const env = {
  ...parsed.data,
  serverRoot,
  projectRoot,
  databaseFile: parsed.data.DATABASE_FILE
    ? path.resolve(parsed.data.DATABASE_FILE)
    : path.join(serverRoot, "storage", "data.sqlite"),
  uploadsDir: parsed.data.UPLOADS_DIR
    ? path.resolve(parsed.data.UPLOADS_DIR)
    : path.join(serverRoot, "storage", "uploads")
};

export function getCorsOrigins(): string[] | boolean {
  if (env.FRONTEND_ORIGIN.trim() === "*") {
    return true;
  }

  return env.FRONTEND_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
