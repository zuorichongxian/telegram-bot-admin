export type ApiEnvelope<T> = {
  message: string;
  data: T;
};

export type SessionStatus = {
  authorized: boolean;
  pendingStage: "code_sent" | "password_required" | null;
  phoneNumber: string | null;
  me: {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string | null;
    username: string | null;
    phone: string | null;
  } | null;
  currentIdentityId: number | null;
};

export type Identity = {
  id: number;
  name: string;
  avatarPath: string | null;
  messageTemplate: string;
  createdAt: string;
  updatedAt: string;
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

export type BotProfile = {
  id: number;
  name: string;
  avatarPath: string | null;
  createdAt: string;
  updatedAt: string;
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

export type BotGroupSendResult = {
  botId: number;
  totalGroups: number;
  sentCount: number;
  failedCount: number;
  sentGroups: Array<{ id: string; title: string }>;
  failedGroups: Array<{ id: string; title: string; error: string }>;
};

export type OperationLog = {
  id: number;
  action: string;
  status: "success" | "error" | "info";
  message: string;
  payload: unknown;
  createdAt: string;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details ?? null;
  }
}

const fallbackBaseUrl =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";

function normalizeApiBaseUrl(rawBaseUrl: string | undefined): string {
  if (!rawBaseUrl) {
    return fallbackBaseUrl;
  }

  const trimmed = rawBaseUrl.trim();

  if (!trimmed || trimmed === "/") {
    return fallbackBaseUrl;
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return new URL(trimmed, fallbackBaseUrl).toString();
  }
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;

  if (init?.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(new URL(path, API_BASE_URL).toString(), {
    ...init,
    headers
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.message ?? "请求失败。", response.status, payload?.details);
  }

  if (!payload) {
    throw new ApiError("响应解析失败，返回数据为空。", response.status);
  }

  return payload as ApiEnvelope<T>;
}

export function resolveAssetUrl(assetPath?: string | null) {
  if (!assetPath) {
    return null;
  }

  return new URL(assetPath, API_BASE_URL).toString();
}
