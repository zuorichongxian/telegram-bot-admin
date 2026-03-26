import { database } from "../db/database.js";
import { AppError } from "../utils/errors.js";
import { operationLogService } from "./OperationLogService.js";

type BotRow = {
  id: number;
  bot_user_id: string;
  username: string | null;
  display_name: string;
  bot_token: string;
  session_string: string;
  current_profile_id: number | null;
  created_at: string;
  updated_at: string;
};

export type BotAccount = {
  id: number;
  botUserId: string;
  username: string | null;
  displayName: string;
  tokenPreview: string;
  currentProfileId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredBotAccount = BotAccount & {
  botToken: string;
  sessionString: string;
};

type CreateBotInput = {
  botUserId: string;
  username: string | null;
  displayName: string;
  botToken: string;
  sessionString: string;
};

type UpdateBotStateInput = {
  username?: string | null;
  displayName?: string;
  sessionString?: string;
  currentProfileId?: number | null;
};

function maskBotToken(token: string) {
  if (token.length <= 10) {
    return `${token.slice(0, 2)}***${token.slice(-2)}`;
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function toStoredBot(row: BotRow): StoredBotAccount {
  return {
    id: Number(row.id),
    botUserId: row.bot_user_id,
    username: row.username,
    displayName: row.display_name,
    tokenPreview: maskBotToken(row.bot_token),
    botToken: row.bot_token,
    sessionString: row.session_string,
    currentProfileId: row.current_profile_id === null ? null : Number(row.current_profile_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toBotAccount(row: BotRow): BotAccount {
  const bot = toStoredBot(row);

  return {
    id: bot.id,
    botUserId: bot.botUserId,
    username: bot.username,
    displayName: bot.displayName,
    tokenPreview: bot.tokenPreview,
    currentProfileId: bot.currentProfileId,
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt
  };
}

export class BotService {
  list() {
    const rows = database.all<BotRow>(
      `
        SELECT id, bot_user_id, username, display_name, bot_token, session_string, current_profile_id, created_at, updated_at
        FROM bots
        ORDER BY id DESC;
      `
    );

    return rows.map(toBotAccount);
  }

  getById(id: number) {
    const row = database.get<BotRow>(
      `
        SELECT id, bot_user_id, username, display_name, bot_token, session_string, current_profile_id, created_at, updated_at
        FROM bots
        WHERE id = ?;
      `,
      [id]
    );

    if (!row) {
      throw new AppError(404, "指定的 Bot 不存在。");
    }

    return toStoredBot(row);
  }

  create(input: CreateBotInput) {
    const existing = this.findByBotUserId(input.botUserId);

    if (existing) {
      operationLogService.record("bot.create", "error", `Bot ${input.displayName} 已接入，不能重复添加。`, {
        botUserId: input.botUserId,
        existingBotId: existing.id
      });
      throw new AppError(409, "该 Bot 已接入，无需重复添加。");
    }

    const now = new Date().toISOString();
    const insertedId = database.insert(
      `
        INSERT INTO bots (
          bot_user_id,
          username,
          display_name,
          bot_token,
          session_string,
          current_profile_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, NULL, ?, ?);
      `,
      [
        input.botUserId,
        input.username,
        input.displayName,
        input.botToken,
        input.sessionString,
        now,
        now
      ]
    );

    const bot = this.getPublicById(insertedId);

    operationLogService.record("bot.create", "success", `接入 Bot ${bot.displayName} 成功。`, {
      botId: bot.id,
      botUserId: bot.botUserId,
      username: bot.username
    });

    return bot;
  }

  delete(id: number) {
    const existing = this.getById(id);

    database.execute("DELETE FROM bots WHERE id = ?;", [id]);

    operationLogService.record("bot.delete", "success", `删除 Bot ${existing.displayName} 成功。`, {
      botId: existing.id,
      botUserId: existing.botUserId
    });

    return existing;
  }

  updateState(id: number, input: UpdateBotStateInput) {
    const existing = this.getById(id);

    database.execute(
      `
        UPDATE bots
        SET username = ?,
            display_name = ?,
            session_string = ?,
            current_profile_id = ?,
            updated_at = ?
        WHERE id = ?;
      `,
      [
        input.username !== undefined ? input.username : existing.username,
        input.displayName !== undefined ? input.displayName : existing.displayName,
        input.sessionString !== undefined ? input.sessionString : existing.sessionString,
        input.currentProfileId !== undefined ? input.currentProfileId : existing.currentProfileId,
        new Date().toISOString(),
        id
      ]
    );

    return this.getById(id);
  }

  clearCurrentProfileByProfileId(profileId: number) {
    database.execute(
      `
        UPDATE bots
        SET current_profile_id = NULL,
            updated_at = ?
        WHERE current_profile_id = ?;
      `,
      [new Date().toISOString(), profileId]
    );
  }

  private findByBotUserId(botUserId: string) {
    const row = database.get<BotRow>(
      `
        SELECT id, bot_user_id, username, display_name, bot_token, session_string, current_profile_id, created_at, updated_at
        FROM bots
        WHERE bot_user_id = ?;
      `,
      [botUserId]
    );

    return row ? toStoredBot(row) : null;
  }

  private getPublicById(id: number) {
    const row = database.get<BotRow>(
      `
        SELECT id, bot_user_id, username, display_name, bot_token, session_string, current_profile_id, created_at, updated_at
        FROM bots
        WHERE id = ?;
      `,
      [id]
    );

    if (!row) {
      throw new AppError(404, "指定的 Bot 不存在。");
    }

    return toBotAccount(row);
  }
}

export const botService = new BotService();
