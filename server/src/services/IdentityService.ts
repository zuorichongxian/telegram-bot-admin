import fs from "node:fs";
import path from "node:path";

import { env } from "../config/env.js";
import { database } from "../db/database.js";
import { AppError } from "../utils/errors.js";
import { operationLogService } from "./OperationLogService.js";

type IdentityRow = {
  id: number;
  name: string;
  avatar_path: string | null;
  message_template: string;
  created_at: string;
  updated_at: string;
};

export type Identity = {
  id: number;
  name: string;
  avatarPath: string | null;
  messageTemplate: string;
  createdAt: string;
  updatedAt: string;
};

type CreateIdentityInput = {
  name: string;
  avatarPath?: string | null;
  messageTemplate?: string;
};

type UpdateIdentityInput = {
  name: string;
  avatarPath?: string | null;
  messageTemplate?: string;
  removeAvatar?: boolean;
};

function toIdentity(row: IdentityRow): Identity {
  return {
    id: Number(row.id),
    name: row.name,
    avatarPath: row.avatar_path,
    messageTemplate: row.message_template,
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

export class IdentityService {
  list() {
    const rows = database.all<IdentityRow>(
      `
        SELECT id, name, avatar_path, message_template, created_at, updated_at
        FROM identities
        ORDER BY id DESC;
      `
    );

    return rows.map(toIdentity);
  }

  getById(id: number) {
    const row = database.get<IdentityRow>(
      `
        SELECT id, name, avatar_path, message_template, created_at, updated_at
        FROM identities
        WHERE id = ?;
      `,
      [id]
    );

    if (!row) {
      throw new AppError(404, "指定的 identity 不存在。");
    }

    return toIdentity(row);
  }

  create(input: CreateIdentityInput) {
    const now = new Date().toISOString();

    const insertedId = database.insert(
      `
        INSERT INTO identities (name, avatar_path, message_template, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?);
      `,
      [input.name, input.avatarPath ?? null, input.messageTemplate ?? "", now, now]
    );

    const identity = this.getById(insertedId);
    operationLogService.record("identity.create", "success", `创建身份 ${identity.name} 成功。`, {
      identityId: identity.id
    });

    return identity;
  }

  update(id: number, input: UpdateIdentityInput) {
    const existing = this.getById(id);
    const nextAvatarPath = input.removeAvatar
      ? null
      : input.avatarPath !== undefined
        ? input.avatarPath
        : existing.avatarPath;
    const updatedAt = new Date().toISOString();

    database.execute(
      `
        UPDATE identities
        SET name = ?, avatar_path = ?, message_template = ?, updated_at = ?
        WHERE id = ?;
      `,
      [input.name, nextAvatarPath ?? null, input.messageTemplate ?? "", updatedAt, id]
    );

    if (input.removeAvatar || input.avatarPath) {
      if (existing.avatarPath && existing.avatarPath !== nextAvatarPath) {
        removeFile(existing.avatarPath);
      }
    }

    const identity = this.getById(id);

    operationLogService.record("identity.update", "success", `更新身份 ${identity.name} 成功。`, {
      identityId: identity.id
    });

    return identity;
  }

  delete(id: number) {
    const existing = this.getById(id);

    database.transaction(() => {
      database.database.run(
        `
          UPDATE session_state
          SET current_identity_id = CASE WHEN current_identity_id = ? THEN NULL ELSE current_identity_id END,
              updated_at = ?
          WHERE id = 1;
        `,
        [id, new Date().toISOString()]
      );

      database.database.run("DELETE FROM identities WHERE id = ?;", [id]);
    });

    removeFile(existing.avatarPath);

    operationLogService.record("identity.delete", "success", `删除身份 ${existing.name} 成功。`, {
      identityId: existing.id
    });
  }
}

export const identityService = new IdentityService();
