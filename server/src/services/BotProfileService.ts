import fs from "node:fs";
import path from "node:path";

import { env } from "../config/env.js";
import { database } from "../db/database.js";
import { AppError } from "../utils/errors.js";
import { operationLogService } from "./OperationLogService.js";

type BotProfileRow = {
  id: number;
  name: string;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export type BotProfile = {
  id: number;
  name: string;
  avatarPath: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateBotProfileInput = {
  name: string;
  avatarPath?: string | null;
};

type UpdateBotProfileInput = {
  name: string;
  avatarPath?: string | null;
  removeAvatar?: boolean;
};

function toBotProfile(row: BotProfileRow): BotProfile {
  return {
    id: Number(row.id),
    name: row.name,
    avatarPath: row.avatar_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function avatarPathToFilePath(avatarPath: string) {
  return path.join(env.uploadsDir, path.basename(avatarPath));
}

function removeFile(avatarPath?: string | null) {
  if (!avatarPath) {
    return;
  }

  const filePath = avatarPathToFilePath(avatarPath);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export class BotProfileService {
  list() {
    const rows = database.all<BotProfileRow>(
      `
        SELECT id, name, avatar_path, created_at, updated_at
        FROM bot_profiles
        ORDER BY id DESC;
      `
    );

    return rows.map(toBotProfile);
  }

  getById(id: number) {
    const row = database.get<BotProfileRow>(
      `
        SELECT id, name, avatar_path, created_at, updated_at
        FROM bot_profiles
        WHERE id = ?;
      `,
      [id]
    );

    if (!row) {
      throw new AppError(404, "指定的 Bot 资料模板不存在。");
    }

    return toBotProfile(row);
  }

  create(input: CreateBotProfileInput) {
    const now = new Date().toISOString();
    const insertedId = database.insert(
      `
        INSERT INTO bot_profiles (name, avatar_path, created_at, updated_at)
        VALUES (?, ?, ?, ?);
      `,
      [input.name, input.avatarPath ?? null, now, now]
    );

    const profile = this.getById(insertedId);

    operationLogService.record("bot.profile.create", "success", `创建 Bot 资料模板 ${profile.name} 成功。`, {
      profileId: profile.id
    });

    return profile;
  }

  update(id: number, input: UpdateBotProfileInput) {
    const existing = this.getById(id);
    const nextAvatarPath = input.removeAvatar
      ? null
      : input.avatarPath !== undefined
        ? input.avatarPath
        : existing.avatarPath;

    database.execute(
      `
        UPDATE bot_profiles
        SET name = ?, avatar_path = ?, updated_at = ?
        WHERE id = ?;
      `,
      [input.name, nextAvatarPath ?? null, new Date().toISOString(), id]
    );

    if ((input.removeAvatar || input.avatarPath) && existing.avatarPath && existing.avatarPath !== nextAvatarPath) {
      removeFile(existing.avatarPath);
    }

    const profile = this.getById(id);

    operationLogService.record("bot.profile.update", "success", `更新 Bot 资料模板 ${profile.name} 成功。`, {
      profileId: profile.id
    });

    return profile;
  }

  delete(id: number) {
    const existing = this.getById(id);

    database.transaction(() => {
      database.database.run(
        `
          UPDATE bots
          SET current_profile_id = NULL,
              updated_at = ?
          WHERE current_profile_id = ?;
        `,
        [new Date().toISOString(), id]
      );
      database.database.run("DELETE FROM bot_profiles WHERE id = ?;", [id]);
    });

    removeFile(existing.avatarPath);

    operationLogService.record("bot.profile.delete", "success", `删除 Bot 资料模板 ${existing.name} 成功。`, {
      profileId: existing.id
    });
  }
}

export const botProfileService = new BotProfileService();
