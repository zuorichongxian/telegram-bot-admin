import fs from "node:fs";
import path from "node:path";

import { Api, TelegramClient } from "telegram";
import { CustomFile } from "telegram/client/uploads.js";
import { StringSession } from "telegram/sessions/index.js";

import { env } from "../../config/env.js";
import { database } from "../../db/database.js";
import { AppError, getErrorMessage, mapTelegramError } from "../../utils/errors.js";
import { splitDisplayName } from "../../utils/name.js";
import { operationLogService } from "../OperationLogService.js";
import type { Identity } from "../IdentityService.js";

type SessionStateRow = {
  session_string: string;
  is_authorized: number;
  phone_number: string | null;
  me_json: string | null;
  pending_session_string: string | null;
  pending_phone_number: string | null;
  pending_phone_code_hash: string | null;
  pending_is_code_via_app: number;
  pending_requires_password: number;
  current_identity_id: number | null;
  updated_at: string;
};

type TelegramMe = {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  phone: string | null;
};

type LoginInput = {
  phoneNumber: string;
  phoneCode?: string;
  password?: string;
};

type LoginResponse =
  | {
      stage: "code_sent";
      message: string;
      isCodeViaApp: boolean;
    }
  | {
      stage: "password_required";
      message: string;
      requiresPassword: true;
    }
  | {
      stage: "authorized";
      message: string;
      authorized: true;
      me: TelegramMe;
    };

function parseStoredMe(meJson: string | null) {
  if (!meJson) {
    return null;
  }

  try {
    return JSON.parse(meJson) as TelegramMe;
  } catch {
    return null;
  }
}

function isPasswordRequired(error: unknown) {
  return getErrorMessage(error).includes("SESSION_PASSWORD_NEEDED");
}

function avatarPathToFilePath(avatarPath: string) {
  return path.join(env.uploadsDir, path.basename(avatarPath));
}

export class TelegramService {
  private client: TelegramClient | null = null;
  private clientSessionString: string | null = null;
  private readonly credentials = {
    apiId: env.TELEGRAM_APP_ID,
    apiHash: env.TELEGRAM_APP_HASH
  };

  async login(input: LoginInput): Promise<LoginResponse> {
    if (!input.phoneCode && !input.password) {
      return this.requestCode(input.phoneNumber);
    }

    if (input.phoneCode) {
      return this.completeCodeLogin(input.phoneNumber, input.phoneCode, input.password);
    }

    return this.completePasswordLogin(input.phoneNumber, input.password ?? "");
  }

  async getStatus() {
    const state = this.getState();
    const pendingStage = state.pending_phone_code_hash
      ? state.pending_requires_password
        ? "password_required"
        : "code_sent"
      : null;

    if (!state.is_authorized || !state.session_string) {
      return {
        authorized: false,
        pendingStage,
        phoneNumber: state.pending_phone_number ?? state.phone_number,
        me: parseStoredMe(state.me_json),
        currentIdentityId: state.current_identity_id
      };
    }

    try {
      const client = await this.getAuthorizedClient();
      const me = this.toTelegramMe(await client.getMe());

      this.updateAuthorizedSession({
        sessionString: this.serializeSession(client),
        phoneNumber: me.phone,
        me,
        currentIdentityId: state.current_identity_id
      });

      return {
        authorized: true,
        pendingStage,
        phoneNumber: me.phone,
        me,
        currentIdentityId: state.current_identity_id
      };
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 401) {
        return {
          authorized: false,
          pendingStage,
          phoneNumber: state.pending_phone_number ?? null,
          me: null,
          currentIdentityId: null
        };
      }

      throw error;
    }
  }

  async logout() {
    const state = this.getState();

    if (!state.is_authorized || !state.session_string) {
      this.clearSessionState();
      return {
        authorized: false
      };
    }

    const me = parseStoredMe(state.me_json);
    let client: TelegramClient | null = null;

    try {
      client = await this.getAuthorizedClient();
      await client.invoke(new Api.auth.LogOut());
      this.clearSessionState();
      operationLogService.record(
        "session.logout",
        "success",
        `Telegram 账号已退出：${me?.displayName ?? state.phone_number ?? "unknown"}。`
      );
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 401) {
        this.clearSessionState();
        operationLogService.record("session.logout", "info", "Telegram 会话已失效，本地登录状态已清除。");

        return {
          authorized: false
        };
      }

      operationLogService.record("session.logout", "error", "退出 Telegram 账号失败。", {
        error: getErrorMessage(error)
      });
      throw mapTelegramError(error, "退出当前账号失败。");
    } finally {
      if (client) {
        try {
          await client.disconnect();
        } catch {
          // noop
        }
      }
    }

    return {
      authorized: false
    };
  }

  async switchIdentity(identity: Identity) {
    const client = await this.getAuthorizedClient();

    try {
      await this.applyIdentity(client, identity);
      const me = this.toTelegramMe(await client.getMe());

      this.updateAuthorizedSession({
        sessionString: this.serializeSession(client),
        phoneNumber: me.phone,
        me,
        currentIdentityId: identity.id
      });

      operationLogService.record("control.switch", "success", `已切换到身份 ${identity.name}。`, {
        identityId: identity.id
      });

      return {
        identityId: identity.id,
        me
      };
    } catch (error) {
      operationLogService.record("control.switch", "error", `切换身份 ${identity.name} 失败。`, {
        identityId: identity.id,
        error: getErrorMessage(error)
      });
      throw mapTelegramError(error, "切换身份失败。");
    }
  }

  async sendMessage(target: string, message: string) {
    const client = await this.getAuthorizedClient();

    try {
      await client.sendMessage(target, { message });

      operationLogService.record("control.send", "success", `消息已发送到 ${target}。`, {
        target
      });

      return {
        target,
        message
      };
    } catch (error) {
      operationLogService.record("control.send", "error", `发送消息到 ${target} 失败。`, {
        target,
        error: getErrorMessage(error)
      });
      throw mapTelegramError(error, "发送消息失败。");
    }
  }

  async switchAndSend(identity: Identity, target: string, message?: string) {
    const client = await this.getAuthorizedClient();
    const finalMessage = message?.trim() || identity.messageTemplate.trim();

    if (!finalMessage) {
      throw new AppError(400, "message 不能为空，且 identity 需要配置 message_template。");
    }

    try {
      await this.applyIdentity(client, identity);
      await client.sendMessage(target, { message: finalMessage });

      const me = this.toTelegramMe(await client.getMe());

      this.updateAuthorizedSession({
        sessionString: this.serializeSession(client),
        phoneNumber: me.phone,
        me,
        currentIdentityId: identity.id
      });

      operationLogService.record(
        "control.switch-and-send",
        "success",
        `已切换到身份 ${identity.name} 并向 ${target} 发送消息。`,
        {
          identityId: identity.id,
          target
        }
      );

      return {
        identityId: identity.id,
        target,
        message: finalMessage,
        me
      };
    } catch (error) {
      operationLogService.record(
        "control.switch-and-send",
        "error",
        `切换身份 ${identity.name} 并发送消息失败。`,
        {
          identityId: identity.id,
          target,
          error: getErrorMessage(error)
        }
      );
      throw mapTelegramError(error, "切换身份并发送消息失败。");
    }
  }

  private async requestCode(phoneNumber: string): Promise<LoginResponse> {
    const state = this.getState();

    if (state.is_authorized && state.session_string) {
      const me = parseStoredMe(state.me_json);

      if (me) {
        return {
          stage: "authorized",
          message: "当前 Telegram 账号已经登录。",
          authorized: true,
          me
        };
      }
    }

    const client = this.createClient("");

    try {
      await client.connect();
      const sentCode = await client.sendCode(this.credentials, phoneNumber);
      const pendingSessionString = this.serializeSession(client);

      this.updatePendingState({
        pendingSessionString,
        pendingPhoneNumber: phoneNumber,
        pendingPhoneCodeHash: sentCode.phoneCodeHash,
        pendingIsCodeViaApp: sentCode.isCodeViaApp,
        pendingRequiresPassword: false
      });

      operationLogService.record("session.login", "info", `已向 ${phoneNumber} 发送登录验证码。`, {
        phoneNumber
      });

      return {
        stage: "code_sent",
        message: "验证码已发送，请继续提交 phoneCode。",
        isCodeViaApp: sentCode.isCodeViaApp
      };
    } catch (error) {
      operationLogService.record("session.login", "error", `发送验证码到 ${phoneNumber} 失败。`, {
        phoneNumber,
        error: getErrorMessage(error)
      });
      throw mapTelegramError(error, "发送验证码失败。");
    } finally {
      await client.disconnect();
    }
  }

  private async completeCodeLogin(
    phoneNumber: string,
    phoneCode: string,
    password?: string
  ): Promise<LoginResponse> {
    const state = this.getState();

    if (!state.pending_session_string || !state.pending_phone_code_hash || !state.pending_phone_number) {
      throw new AppError(400, "当前没有待完成的验证码登录流程，请先请求验证码。");
    }

    if (state.pending_phone_number !== phoneNumber) {
      throw new AppError(400, "手机号与当前待登录流程不一致，请重新获取验证码。");
    }

    const client = this.createClient(state.pending_session_string);

    try {
      await client.connect();
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber,
          phoneCodeHash: state.pending_phone_code_hash,
          phoneCode
        })
      );

      return await this.finalizeAuthorizedLogin(client);
    } catch (error) {
      if (isPasswordRequired(error)) {
        this.updatePendingState({
          pendingSessionString: this.serializeSession(client),
          pendingPhoneNumber: phoneNumber,
          pendingPhoneCodeHash: state.pending_phone_code_hash,
          pendingIsCodeViaApp: Boolean(state.pending_is_code_via_app),
          pendingRequiresPassword: true
        });

        if (!password) {
          return {
            stage: "password_required",
            message: "该账号启用了二步验证，请继续提交 password。",
            requiresPassword: true
          };
        }

        await this.performPasswordLogin(client, password);
        return await this.finalizeAuthorizedLogin(client);
      }

      operationLogService.record("session.login", "error", `验证码登录 ${phoneNumber} 失败。`, {
        phoneNumber,
        error: getErrorMessage(error)
      });

      throw mapTelegramError(error, "验证码登录失败。");
    } finally {
      await client.disconnect();
    }
  }

  private async completePasswordLogin(phoneNumber: string, password: string): Promise<LoginResponse> {
    const state = this.getState();

    if (!state.pending_session_string || !state.pending_phone_number) {
      throw new AppError(400, "当前没有待完成的登录流程，请先请求验证码。");
    }

    if (state.pending_phone_number !== phoneNumber) {
      throw new AppError(400, "手机号与当前待登录流程不一致，请重新获取验证码。");
    }

    if (!state.pending_requires_password) {
      throw new AppError(400, "当前账号不需要单独提交二步验证密码，请先完成验证码登录。");
    }

    const client = this.createClient(state.pending_session_string);

    try {
      await client.connect();
      await this.performPasswordLogin(client, password);
      return await this.finalizeAuthorizedLogin(client);
    } catch (error) {
      operationLogService.record("session.login", "error", `二步验证登录 ${phoneNumber} 失败。`, {
        phoneNumber,
        error: getErrorMessage(error)
      });

      throw mapTelegramError(error, "二步验证登录失败。");
    } finally {
      await client.disconnect();
    }
  }

  private async finalizeAuthorizedLogin(client: TelegramClient): Promise<LoginResponse> {
    const me = this.toTelegramMe(await client.getMe());
    const sessionString = this.serializeSession(client);

    this.updateAuthorizedSession({
      sessionString,
      phoneNumber: me.phone,
      me,
      currentIdentityId: null
    });

    operationLogService.record("session.login", "success", `Telegram 登录成功：${me.displayName}。`, {
      phoneNumber: me.phone
    });

    return {
      stage: "authorized",
      message: "Telegram 登录成功。",
      authorized: true,
      me
    };
  }

  private async performPasswordLogin(client: TelegramClient, password: string) {
    await client.signInWithPassword(this.credentials, {
      password: async () => password,
      onError: async (error) => {
        throw error;
      }
    });
  }

  private async applyIdentity(client: TelegramClient, identity: Identity) {
    const { firstName, lastName } = splitDisplayName(identity.name);

    await client.invoke(
      new Api.account.UpdateProfile({
        firstName,
        lastName
      })
    );

    if (identity.avatarPath) {
      const avatarFilePath = avatarPathToFilePath(identity.avatarPath);

      if (!fs.existsSync(avatarFilePath)) {
        throw new AppError(400, `identity ${identity.name} 的头像文件不存在，请重新上传。`);
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
  }

  private async getAuthorizedClient() {
    const state = this.getState();

    if (!state.is_authorized || !state.session_string) {
      throw new AppError(401, "当前没有可用的 Telegram 登录会话，请先登录。");
    }

    if (this.client && this.clientSessionString === state.session_string) {
      try {
        const isAuthorized = await this.client.checkAuthorization();

        if (isAuthorized) {
          return this.client;
        }
      } catch {
        // Ignore cached client failures and recreate a fresh connection below.
      }

      try {
        await this.client.disconnect();
      } catch {
        // noop
      }
      this.client = null;
      this.clientSessionString = null;
    }

    const client = this.createClient(state.session_string);

    try {
      await client.connect();
      const isAuthorized = await client.checkAuthorization();

      if (!isAuthorized) {
        await client.disconnect();
        this.clearSessionState();
        throw new AppError(401, "Telegram 会话已失效，请重新登录。");
      }

      this.client = client;
      this.clientSessionString = state.session_string;
      return client;
    } catch (error) {
      try {
        await client.disconnect();
      } catch {
        // noop
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw mapTelegramError(error, "连接 Telegram 会话失败。");
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

  private toTelegramMe(user: Api.User): TelegramMe {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

    return {
      id: user.id.toString(),
      displayName,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? null,
      username: user.username ?? null,
      phone: user.phone ?? null
    };
  }

  private getState() {
    const row = database.get<SessionStateRow>(
      `
        SELECT session_string, is_authorized, phone_number, me_json, pending_session_string,
               pending_phone_number, pending_phone_code_hash, pending_is_code_via_app,
               pending_requires_password, current_identity_id, updated_at
        FROM session_state
        WHERE id = 1;
      `
    );

    if (!row) {
      throw new AppError(500, "session_state 初始化失败。");
    }

    return row;
  }

  private updatePendingState(input: {
    pendingSessionString: string | null;
    pendingPhoneNumber: string | null;
    pendingPhoneCodeHash: string | null;
    pendingIsCodeViaApp: boolean;
    pendingRequiresPassword: boolean;
  }) {
    database.execute(
      `
        UPDATE session_state
        SET pending_session_string = ?,
            pending_phone_number = ?,
            pending_phone_code_hash = ?,
            pending_is_code_via_app = ?,
            pending_requires_password = ?,
            updated_at = ?
        WHERE id = 1;
      `,
      [
        input.pendingSessionString,
        input.pendingPhoneNumber,
        input.pendingPhoneCodeHash,
        input.pendingIsCodeViaApp ? 1 : 0,
        input.pendingRequiresPassword ? 1 : 0,
        new Date().toISOString()
      ]
    );
  }

  private updateAuthorizedSession(input: {
    sessionString: string;
    phoneNumber: string | null;
    me: TelegramMe;
    currentIdentityId: number | null;
  }) {
    database.execute(
      `
        UPDATE session_state
        SET session_string = ?,
            is_authorized = 1,
            phone_number = ?,
            me_json = ?,
            pending_session_string = NULL,
            pending_phone_number = NULL,
            pending_phone_code_hash = NULL,
            pending_is_code_via_app = 0,
            pending_requires_password = 0,
            current_identity_id = ?,
            updated_at = ?
        WHERE id = 1;
      `,
      [
        input.sessionString,
        input.phoneNumber,
        JSON.stringify(input.me),
        input.currentIdentityId,
        new Date().toISOString()
      ]
    );

    this.clientSessionString = input.sessionString;
  }

  private clearSessionState() {
    database.execute(
      `
        UPDATE session_state
        SET session_string = '',
            is_authorized = 0,
            phone_number = NULL,
            me_json = NULL,
            pending_session_string = NULL,
            pending_phone_number = NULL,
            pending_phone_code_hash = NULL,
            pending_is_code_via_app = 0,
            pending_requires_password = 0,
            current_identity_id = NULL,
            updated_at = ?
        WHERE id = 1;
      `,
      [new Date().toISOString()]
    );

    this.client = null;
    this.clientSessionString = null;
  }
}

export const telegramService = new TelegramService();
