import fs from "node:fs";
import path from "node:path";

import { Api, TelegramClient } from "telegram";
import { CustomFile } from "telegram/client/uploads.js";
import { StringSession } from "telegram/sessions/index.js";

import { env } from "../../config/env.js";
import { AppError, getErrorMessage, mapTelegramError } from "../../utils/errors.js";
import { botProfileService } from "../BotProfileService.js";
import { botService, type StoredBotAccount } from "../BotService.js";
import { operationLogService } from "../OperationLogService.js";

type BotIdentity = {
  botUserId: string;
  username: string | null;
  displayName: string;
};

export type BotGroup = {
  id: string;
  title: string;
  username: string | null;
  type: "group" | "supergroup";
};

export type BotGroupDiagnostics = {
  botId: number;
  botDisplayName: string;
  mergedGroups: BotGroup[];
  mtproto: {
    totalDialogs: number;
    groupDialogsCount: number;
    error: string | null;
  };
  botApi: {
    webhookUrl: string | null;
    pendingUpdateCount: number;
    lastErrorMessage: string | null;
    getUpdatesConflictReason: string | null;
    totalUpdatesFetched: number;
    candidateGroupHitCount: number;
    confirmedGroupCount: number;
    error: string | null;
  };
  hints: string[];
};

type BotApiChat = {
  id: number | string;
  title?: string;
  username?: string;
  type?: string;
};

type BotApiUpdate = {
  message?: { chat?: BotApiChat };
  edited_message?: { chat?: BotApiChat };
  channel_post?: { chat?: BotApiChat };
  edited_channel_post?: { chat?: BotApiChat };
  my_chat_member?: {
    chat?: BotApiChat;
    new_chat_member?: {
      status?: string;
      user?: {
        id?: number | string;
      };
    };
  };
  chat_member?: {
    chat?: BotApiChat;
    new_chat_member?: {
      status?: string;
      user?: {
        id?: number | string;
      };
    };
  };
};

type BotApiEnvelope<T> = {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
};

type BotApiWebhookInfo = {
  url?: string;
  pending_update_count?: number;
  last_error_message?: string;
};

type BotGroupDialog = BotGroup & {
  inputEntity: Api.TypeInputPeer;
};

function avatarPathToFilePath(avatarPath: string) {
  return path.join(env.uploadsDir, path.basename(avatarPath));
}

function previewToken(token: string) {
  if (token.length <= 10) {
    return `${token.slice(0, 2)}***${token.slice(-2)}`;
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export class BotTelegramService {
  private readonly credentials = {
    apiId: env.TELEGRAM_APP_ID,
    apiHash: env.TELEGRAM_APP_HASH
  };

  private readonly clientCache = new Map<number, { client: TelegramClient; sessionString: string }>();

  async createBotAccount(token: string) {
    let authorizedClient: TelegramClient | null = null;

    try {
      const authorization = await this.authorizeWithToken(token);
      authorizedClient = authorization.client;

      const bot = botService.create({
        botUserId: authorization.me.botUserId,
        username: authorization.me.username,
        displayName: authorization.me.displayName,
        botToken: token,
        sessionString: authorization.sessionString
      });

      return bot;
    } catch (error) {
      if (!(error instanceof AppError && error.statusCode === 409)) {
        operationLogService.record("bot.create", "error", "接入 Bot 失败。", {
          tokenPreview: previewToken(token),
          error: getErrorMessage(error)
        });
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw mapTelegramError(error, "接入 Bot 失败。");
    } finally {
      if (authorizedClient) {
        await authorizedClient.disconnect().catch(() => undefined);
      }
    }
  }

  async deleteBot(id: number) {
    await this.disconnectCachedClient(id);
    return botService.delete(id);
  }

  async applyProfile(botId: number, profileId: number) {
    const bot = botService.getById(botId);
    const profile = botProfileService.getById(profileId);
    const client = await this.getAuthorizedClient(bot);

    try {
      await client.invoke(
        new Api.bots.SetBotInfo({
          langCode: "",
          name: profile.name
        })
      );

      if (profile.avatarPath) {
        const avatarFilePath = avatarPathToFilePath(profile.avatarPath);

        if (!fs.existsSync(avatarFilePath)) {
          throw new AppError(400, `Bot 资料模板 ${profile.name} 的头像文件不存在，请重新上传。`);
        }

        const stat = fs.statSync(avatarFilePath);
        const uploaded = await client.uploadFile({
          file: new CustomFile(path.basename(avatarFilePath), stat.size, avatarFilePath),
          workers: 1
        });

        await client.invoke(
          new Api.photos.UploadProfilePhoto({
            file: uploaded
          })
        );
      }

      const me = this.toBotIdentity(await client.getMe());

      botService.updateState(bot.id, {
        username: me.username,
        displayName: me.displayName,
        sessionString: this.serializeSession(client),
        currentProfileId: profile.id
      });

      operationLogService.record(
        "bot.apply-profile",
        "success",
        `已将模板 ${profile.name} 应用到 Bot ${me.displayName}。`,
        {
          botId: bot.id,
          profileId: profile.id,
          botUserId: me.botUserId
        }
      );

      return {
        botId: bot.id,
        profileId: profile.id,
        me
      };
    } catch (error) {
      operationLogService.record("bot.apply-profile", "error", `应用模板 ${profile.name} 到 Bot 失败。`, {
        botId: bot.id,
        profileId: profile.id,
        error: getErrorMessage(error)
      });

      throw error instanceof AppError ? error : mapTelegramError(error, "应用 Bot 资料失败。");
    }
  }

  async listGroups(botId: number) {
    const diagnostics = await this.getGroupDiagnostics(botId);
    return diagnostics.mergedGroups;
  }

  async getGroupDiagnostics(botId: number): Promise<BotGroupDiagnostics> {
    const bot = botService.getById(botId);
    const [dialogDiagnostics, botApiDiagnostics] = await Promise.all([
      this.collectDialogDiagnostics(bot),
      this.collectBotApiDiagnostics(bot)
    ]);
    const mergedGroups = this.mergeGroups([
      ...dialogDiagnostics.groups,
      ...botApiDiagnostics.groups
    ]);

    return {
      botId: bot.id,
      botDisplayName: bot.displayName,
      mergedGroups,
      mtproto: {
        totalDialogs: dialogDiagnostics.totalDialogs,
        groupDialogsCount: dialogDiagnostics.groups.length,
        error: dialogDiagnostics.error
      },
      botApi: {
        webhookUrl: botApiDiagnostics.webhookUrl,
        pendingUpdateCount: botApiDiagnostics.pendingUpdateCount,
        lastErrorMessage: botApiDiagnostics.lastErrorMessage,
        getUpdatesConflictReason: botApiDiagnostics.getUpdatesConflictReason,
        totalUpdatesFetched: botApiDiagnostics.totalUpdatesFetched,
        candidateGroupHitCount: botApiDiagnostics.candidateGroupHitCount,
        confirmedGroupCount: botApiDiagnostics.groups.length,
        error: botApiDiagnostics.error
      },
      hints: this.buildDiagnosticsHints(dialogDiagnostics, botApiDiagnostics, mergedGroups.length)
    };
  }

  async sendMessageToGroups(botId: number, groupIds: string[], message: string) {
    const bot = botService.getById(botId);
    const groups = await this.listGroups(botId);
    const uniqueGroupIds = [...new Set(groupIds)];
    const groupsById = new Map(groups.map((group) => [group.id, group]));
    const missingGroupIds = uniqueGroupIds.filter((groupId) => !groupsById.has(groupId));

    if (missingGroupIds.length) {
      throw new AppError(400, "所选群组里有部分已不在当前 Bot 对话列表中，请刷新群组列表后重试。");
    }

    const sentGroups: Array<{ id: string; title: string }> = [];
    const failedGroups: Array<{ id: string; title: string; error: string }> = [];

    for (const groupId of uniqueGroupIds) {
      const group = groupsById.get(groupId);

      if (!group) {
        continue;
      }

      try {
        await this.sendBotApiMessage(bot.botToken, group.id, message);
        sentGroups.push({
          id: group.id,
          title: group.title
        });
      } catch (error) {
        failedGroups.push({
          id: group.id,
          title: group.title,
          error: getErrorMessage(error)
        });
      }
    }

    const status = failedGroups.length ? (sentGroups.length ? "info" : "error") : "success";
    const summaryMessage =
      failedGroups.length === 0
        ? `Bot 已向 ${sentGroups.length} 个群组发送消息。`
        : sentGroups.length
          ? `Bot 已向 ${sentGroups.length} 个群组发送消息，${failedGroups.length} 个群组发送失败。`
          : "Bot 群发失败，未发送到任何群组。";

    operationLogService.record("bot.send-groups", status, summaryMessage, {
      botId,
      totalGroups: uniqueGroupIds.length,
      sentGroups,
      failedGroups
    });

    if (!sentGroups.length) {
      throw new AppError(500, "群发失败，未发送到任何群组。", {
        failedGroups
      });
    }

    return {
      botId,
      totalGroups: uniqueGroupIds.length,
      sentCount: sentGroups.length,
      failedCount: failedGroups.length,
      sentGroups,
      failedGroups
    };
  }

  private async getAuthorizedClient(bot: StoredBotAccount) {
    const cached = this.clientCache.get(bot.id);

    if (cached && cached.sessionString === bot.sessionString) {
      try {
        const isAuthorized = await cached.client.checkAuthorization();

        if (isAuthorized) {
          return cached.client;
        }
      } catch {
        // Ignore cached client failures and fall through to fresh authorization.
      }

      await this.disconnectCachedClient(bot.id);
    }

    if (bot.sessionString) {
      const client = this.createClient(bot.sessionString);

      try {
        await client.connect();
        const isAuthorized = await client.checkAuthorization();

        if (isAuthorized) {
          this.clientCache.set(bot.id, {
            client,
            sessionString: bot.sessionString
          });

          return client;
        }
      } catch {
        // Fall back to token login below.
      }

      await client.disconnect().catch(() => undefined);
    }

    const authorization = await this.authorizeWithToken(bot.botToken);

    botService.updateState(bot.id, {
      username: authorization.me.username,
      displayName: authorization.me.displayName,
      sessionString: authorization.sessionString
    });

    this.clientCache.set(bot.id, {
      client: authorization.client,
      sessionString: authorization.sessionString
    });

    return authorization.client;
  }

  private async authorizeWithToken(token: string) {
    const client = this.createClient("");

    try {
      await client.connect();
      await client.invoke(
        new Api.auth.ImportBotAuthorization({
          apiId: this.credentials.apiId,
          apiHash: this.credentials.apiHash,
          botAuthToken: token
        })
      );

      const me = this.toBotIdentity(await client.getMe());

      return {
        client,
        sessionString: this.serializeSession(client),
        me
      };
    } catch (error) {
      await client.disconnect().catch(() => undefined);
      throw error;
    }
  }

  private createClient(sessionString: string) {
    return new TelegramClient(new StringSession(sessionString), env.TELEGRAM_APP_ID, env.TELEGRAM_APP_HASH, {
      connectionRetries: 5
    });
  }

  private serializeSession(client: TelegramClient) {
    return (client.session as StringSession).save();
  }

  private toBotIdentity(user: Api.User) {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || user.id.toString();

    return {
      botUserId: user.id.toString(),
      username: user.username ?? null,
      displayName
    } satisfies BotIdentity;
  }

  private async listGroupDialogs(bot: StoredBotAccount): Promise<BotGroupDialog[]> {
    const client = await this.getAuthorizedClient(bot);
    const dialogs = await client.getDialogs({
      limit: undefined,
      ignoreMigrated: true
    });

    return dialogs
      .filter((dialog) => dialog.isGroup)
      .map((dialog) => {
        const isSupergroup = dialog.entity instanceof Api.Channel && dialog.entity.megagroup;

        return {
          id: dialog.id?.toString() ?? dialog.entity?.id?.toString() ?? "",
          title: dialog.title ?? dialog.name ?? "未命名群组",
          username: dialog.entity instanceof Api.Channel ? dialog.entity.username ?? null : null,
          type: isSupergroup ? "supergroup" : "group",
          inputEntity: dialog.inputEntity
        } satisfies BotGroupDialog;
      })
      .filter((group) => Boolean(group.id));
  }

  private async listGroupsFromBotApi(bot: StoredBotAccount): Promise<BotGroup[]> {
    const diagnostics = await this.collectBotApiDiagnostics(bot);
    return diagnostics.groups;
  }

  private extractCandidateChats(update: BotApiUpdate, botUserId: string) {
    const candidates: BotApiChat[] = [];
    const updateChats = [
      update.message?.chat,
      update.edited_message?.chat,
      update.channel_post?.chat,
      update.edited_channel_post?.chat
    ];

    for (const chat of updateChats) {
      if (chat) {
        candidates.push(chat);
      }
    }

    const membershipUpdates = [update.my_chat_member, update.chat_member];

    for (const membershipUpdate of membershipUpdates) {
      const memberUserId = membershipUpdate?.new_chat_member?.user?.id?.toString();
      const status = membershipUpdate?.new_chat_member?.status;

      if (
        membershipUpdate?.chat &&
        memberUserId === botUserId &&
        status &&
        !["left", "kicked"].includes(status)
      ) {
        candidates.push(membershipUpdate.chat);
      }
    }

    return candidates;
  }

  private toBotGroup(chat: BotApiChat): BotGroup | null {
    if (!chat.type || !["group", "supergroup"].includes(chat.type)) {
      return null;
    }

    return {
      id: chat.id.toString(),
      title: chat.title?.trim() || "未命名群组",
      username: chat.username ?? null,
      type: chat.type === "supergroup" ? "supergroup" : "group"
    };
  }

  private mergeGroups(groups: BotGroup[]) {
    return [...new Map(groups.map((group) => [group.id, group])).values()].sort((left, right) =>
      left.title.localeCompare(right.title, "zh-CN")
    );
  }

  private async collectDialogDiagnostics(bot: StoredBotAccount) {
    return {
      totalDialogs: 0,
      groups: [] as BotGroup[],
      error: "Skipped: bot accounts cannot call messages.getDialogs."
    };

    try {
      const client = await this.getAuthorizedClient(bot);
      const dialogs = await client.getDialogs({
        limit: undefined,
        ignoreMigrated: true
      });

      const groups = dialogs
        .filter((dialog) => dialog.isGroup)
        .map((dialog) => {
          const isSupergroup = dialog.entity instanceof Api.Channel && dialog.entity.megagroup;

          return {
            id: dialog.id?.toString() ?? dialog.entity?.id?.toString() ?? "",
            title: dialog.title ?? dialog.name ?? "未命名群组",
            username: dialog.entity instanceof Api.Channel ? dialog.entity.username ?? null : null,
            type: isSupergroup ? "supergroup" : "group"
          } satisfies BotGroup;
        })
        .filter((group) => Boolean(group.id));

      return {
        totalDialogs: dialogs.length,
        groups,
        error: null as string | null
      };
    } catch (error) {
      return {
        totalDialogs: 0,
        groups: [] as BotGroup[],
        error: getErrorMessage(error)
      };
    }
  }

  private async collectBotApiDiagnostics(bot: StoredBotAccount) {
    let webhookInfo: BotApiWebhookInfo | null = null;
    let updates: BotApiUpdate[] = [];
    let getUpdatesConflictReason: string | null = null;
    let error: string | null = null;

    try {
      webhookInfo = await this.botApiRequest<BotApiWebhookInfo>(bot.botToken, "getWebhookInfo");
    } catch (webhookError) {
      error = getErrorMessage(webhookError);
    }

    try {
      updates = await this.botApiRequest<BotApiUpdate[]>(bot.botToken, "getUpdates", {
        limit: 100,
        timeout: 0,
        allowed_updates: [
          "message",
          "edited_message",
          "channel_post",
          "edited_channel_post",
          "my_chat_member",
          "chat_member"
        ]
      });
    } catch (updatesError) {
      const description = getErrorMessage(updatesError);

      if (description.includes("can't use getUpdates method while webhook is active")) {
        getUpdatesConflictReason = description;
      } else {
        error = error ?? description;
      }
    }

    const seen = new Map<string, BotGroup>();

    for (const update of updates) {
      for (const chat of this.extractCandidateChats(update, bot.botUserId)) {
        const group = this.toBotGroup(chat);

        if (!group) {
          continue;
        }

        seen.set(group.id, group);
      }
    }

    const candidateGroups = [...seen.values()];
    const confirmedGroups: BotGroup[] = [];

    for (const group of candidateGroups) {
      try {
        const member = await this.botApiRequest<{ status?: string }>(bot.botToken, "getChatMember", {
          chat_id: group.id,
          user_id: bot.botUserId
        });

        if (member.status && !["left", "kicked"].includes(member.status)) {
          confirmedGroups.push(group);
        }
      } catch (memberError) {
        operationLogService.record("bot.groups", "info", `校验群组 ${group.title} 成员状态失败，已跳过该群组。`, {
          botId: bot.id,
          groupId: group.id,
          error: getErrorMessage(memberError)
        });
      }
    }

    return {
      webhookUrl: webhookInfo?.url?.trim() || null,
      pendingUpdateCount: webhookInfo?.pending_update_count ?? 0,
      lastErrorMessage: webhookInfo?.last_error_message ?? null,
      getUpdatesConflictReason,
      totalUpdatesFetched: updates.length,
      candidateGroupHitCount: candidateGroups.length,
      groups: confirmedGroups,
      error
    };
  }

  private buildDiagnosticsHints(
    dialogDiagnostics: { totalDialogs: number; groups: BotGroup[]; error: string | null },
    botApiDiagnostics: {
      webhookUrl: string | null;
      totalUpdatesFetched: number;
      candidateGroupHitCount: number;
      groups: BotGroup[];
      getUpdatesConflictReason: string | null;
      error: string | null;
    },
    mergedGroupCount: number
  ) {
    const hints: string[] = [];

    if (dialogDiagnostics.error === "Skipped: bot accounts cannot call messages.getDialogs.") {
      hints.push("MTProto getDialogs is not available for bot accounts, so this path is skipped.");
    } else if (dialogDiagnostics.error) {
      hints.push(`MTProto getDialogs 调用失败：${dialogDiagnostics.error}`);
    } else if (dialogDiagnostics.totalDialogs === 0) {
      hints.push("MTProto 对话列表为空，说明这个 bot 当前没有任何可见 dialogs。");
    } else if (dialogDiagnostics.groups.length === 0) {
      hints.push("MTProto 能拿到 dialogs，但其中没有被识别为群组的对话。");
    }

    if (botApiDiagnostics.getUpdatesConflictReason) {
      hints.push(`Bot API getUpdates 被阻塞：${botApiDiagnostics.getUpdatesConflictReason}`);
    } else if (botApiDiagnostics.totalUpdatesFetched === 0) {
      hints.push("Bot API 当前没有可读 updates；如果加群事件已经被消费或过期，这条路径就拿不到群。");
    } else if (botApiDiagnostics.candidateGroupHitCount === 0) {
      hints.push("Bot API 虽然拉到了 updates，但这些 updates 里没有命中任何 group/supergroup 聊天。");
    } else if (botApiDiagnostics.groups.length === 0) {
      hints.push("Bot API 命中了群组聊天，但在 getChatMember 校验时没有确认 bot 仍在这些群里。");
    }

    if (!mergedGroupCount) {
      hints.push("当前两条发现路径都没有得到可用群组。最常见原因是：bot 很早之前加群、更新已被其他程序消费，或者 bot 当前使用 webhook。");
    }

    if (botApiDiagnostics.webhookUrl) {
      hints.push(`当前 bot 配置了 webhook：${botApiDiagnostics.webhookUrl}`);
    }

    if (botApiDiagnostics.error) {
      hints.push(`Bot API 调用异常：${botApiDiagnostics.error}`);
    }

    return hints;
  }

  private async sendBotApiMessage(token: string, chatId: string, message: string) {
    await this.botApiRequest(token, "sendMessage", {
      chat_id: chatId,
      text: message
    });
  }

  private async botApiRequest<T>(token: string, method: string, body?: Record<string, unknown>) {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: body ? "POST" : "GET",
      headers: body
        ? {
            "Content-Type": "application/json"
          }
        : undefined,
      body: body ? JSON.stringify(body) : undefined
    });

    const payload = (await response.json().catch(() => null)) as BotApiEnvelope<T> | null;

    if (!response.ok || !payload?.ok) {
      throw new AppError(payload?.error_code || response.status || 500, payload?.description ?? `Bot API ${method} 请求失败。`);
    }

    if (payload.result === undefined) {
      throw new AppError(500, `Bot API ${method} 没有返回结果。`);
    }

    return payload.result;
  }

  private async disconnectCachedClient(id: number) {
    const cached = this.clientCache.get(id);

    if (!cached) {
      return;
    }

    this.clientCache.delete(id);
    await cached.client.disconnect().catch(() => undefined);
  }
}

export const botTelegramService = new BotTelegramService();
